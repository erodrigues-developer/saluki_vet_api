# Deploy automático na EC2

O workflow `.github/workflows/deploy-ec2.yml` executa testes e compila a aplicação no runner do GitHub. Todos os comandos de transferência, troca do contêiner e rollback ficam no próprio YAML, em Bash. O Dockerfile apenas empacota o resultado da build. A imagem Docker pronta é enviada por SSH à EC2. A máquina de produção apenas carrega a imagem e troca o contêiner; não executa npm install ou build.

Publicar uma release (evento `release: published`) faz deploy automático do commit apontado pela tag da release. Salvar um rascunho não inicia o deploy. Pull requests para `main` executam a validação e a build, sem deploy. Também é possível executar manualmente em **Actions → Build and deploy API to EC2 → Run workflow**, selecionando `main`.

## Ativação

Os arquivos foram preparados localmente. Publique-os no respectivo repositório para o GitHub reconhecer o workflow.

Em **Settings → Secrets and variables → Actions**, crie estes secrets em **cada um dos dois repositórios**:

| Secret | Conteúdo |
| --- | --- |
| `EC2_SSH_PRIVATE_KEY` | Conteúdo completo da chave privada que permite login como `ubuntu` na EC2, incluindo BEGIN/END e quebras de linha. A chave atual é `saluki_server.pem`; não a adicione ao Git. |
| `EC2_KNOWN_HOSTS` | Registro(s) known_hosts verificado(s) para `ec2-54-89-10-179.compute-1.amazonaws.com`. O workflow exige conferência da identidade SSH. |

Para obter o registro já verificado depois de conectar à EC2 com sua chave:

```sh
ssh-keygen -F ec2-54-89-10-179.compute-1.amazonaws.com -f ~/.ssh/known_hosts | sed '/^#/d'
```

Copie a saída para `EC2_KNOWN_HOSTS`. Não use chave de host obtida de uma fonte não verificada. A chave privada usada no workflow deve permitir autenticação sem senha interativa.

Variáveis de repositório opcionais:

| Variável | Padrão |
| --- | --- |
| `EC2_HOST` | `ec2-54-89-10-179.compute-1.amazonaws.com` |
| `EC2_USER` | `ubuntu` |

O usuário remoto precisa de Docker, Bash, `jq`, `curl`, `flock`, `timeout`, `nice`, `ionice` e permissão para executar Docker sem sudo. A configuração atual da EC2 já possui essas ferramentas.

Consulte a [documentação de secrets do GitHub](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) para cadastrar valores multilinha. Se quiser restringir quem pode modificar a automação de produção, proteja a branch `main`.

## Comportamento na EC2

- Uma trava em `$HOME/.saluki-deploy.lock` serializa o carregamento das imagens e a troca dos serviços dos dois repositórios. `cancel-in-progress: false` mantém o deploy em andamento até concluir ou restaurar o contêiner anterior.
- A API mantém o nome `saluki_vet_api`, a porta host 3001 → contêiner 3000, o ambiente atual e todos os bind mounts, incluindo `.env` e uploads. Exige uploads persistentes, `APP_ORIGINS` e `MONITORING_TOKEN` já configurados.
- A UI mantém `saluki-vet-ui`, porta host 3002 → contêiner 3001 e proxy interno `http://host.docker.internal:3001`.
- Limites Docker: API 384 MB, UI 256 MB. Heap Node: API 256 MB, UI 160 MB. Logs: até três arquivos de 10 MB por serviço.
- SHA-256 valida o arquivo recebido antes de parar o serviço. A imagem é carregada com prioridade reduzida.
- API: readiness autenticada verifica PostgreSQL e Redis; também verifica liveness HTTPS pública. UI: verifica login, estilos SSR, resposta 401 da sessão sem autenticação e login HTTPS público.
- Se a troca ou a verificação falhar, o contêiner anterior é restaurado e o workflow falha. Isso inclui interrupções tratáveis por SIGTERM/SIGINT.
- Após sucesso, mantém um contêiner anterior parado por serviço, com restart automático desativado: `saluki_vet_api-previous` / `saluki-vet-ui-previous`. Na próxima execução bem-sucedida remove o backup anterior e tenta remover apenas sua imagem, sem `--force` ou prune global. O arquivo comprimido enviado é removido após sucesso.
- Arquivos de execução ficam em `$HOME/saluki-deploy/<serviço>-<commit>-<run>-<attempt>/`, com permissões privadas. `runtime.env` e `previous-container.json` contêm segredos; não os publique. O arquivo de ambiente é usado para criar o contêiner e não fica montado nele. Para atualizar a configuração, recrie o contêiner atual com os novos valores antes do próximo deploy; editar um snapshot não modifica um contêiner já criado.

Os deploys são independentes por repositório. Uma mudança de contrato que exija API e UI simultaneamente precisa de um rollout compatível ou de uma implantação coordenada. Migrations e seeds não são executados automaticamente.

## Validação e recuperação

A sintaxe dos workflows pode ser validada com Actionlint. Os blocos Bash podem ser conferidos com ShellCheck. Os testes da aplicação continuam sendo executados no pipeline antes do deploy.

Um rollback manual precisa considerar compatibilidade da API/UI e das alterações de banco. Para restaurar o backup da API, depois dessa avaliação:

```sh
docker stop saluki_vet_api
docker rename saluki_vet_api saluki_vet_api-failed
docker rename saluki_vet_api-previous saluki_vet_api
docker update --restart unless-stopped saluki_vet_api
docker start saluki_vet_api
```

Para UI, substitua `saluki_vet_api` por `saluki-vet-ui`. Execute manutenção/rollback sob a mesma trava `flock "$HOME/.saluki-deploy.lock"` para evitar concorrência com o workflow. Não restaure versões com autenticação legada apenas para contornar problemas de sessão.
