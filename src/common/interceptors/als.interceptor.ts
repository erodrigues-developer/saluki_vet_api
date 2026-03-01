import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { als } from '../utils/als';

@Injectable()
export class AlsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const store = new Map<string, any>();

    if (req.user) {
      store.set('userId', req.user.userId ?? req.user.id);
    }

    return new Observable((subscriber) => {
      als.run(store, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
