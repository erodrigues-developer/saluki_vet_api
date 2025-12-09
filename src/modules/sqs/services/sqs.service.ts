import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly sqsClient: SQSClient,
  ) {}

  async sendMessage(
    message: string,
    messageGroupId: string,
    messageDeduplicationId: string,
    queueUrl: string,
  ): Promise<unknown> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message,
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: messageDeduplicationId,
    });

    return await this.sqsClient.send(command);
  }

  async receiveMessage(queueUrl: string): Promise<any> {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages:
        parseInt(this.configService.get<string>('admin.paymentsPerMinute')) ??
        10,
    });

    return await this.sqsClient.send(command);
  }

  public async deleteMessage(
    receiptHandle: string,
    queueUrl: string,
  ): Promise<any> {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    return await this.sqsClient.send(command);
  }
}
