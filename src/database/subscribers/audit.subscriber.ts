import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { als } from '../../common/utils/als';
import { AuditLog } from '../../modules/audit-logs/entities/audit-log.entity';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  afterInsert(event: InsertEvent<any>) {
    this.createAuditLog('CREATE', event, null, event.entity);
  }

  afterUpdate(event: UpdateEvent<any>) {
    this.createAuditLog('UPDATE', event, event.databaseEntity, event.entity);
  }

  afterRemove(event: RemoveEvent<any>) {
    this.createAuditLog('DELETE', event, event.databaseEntity, null);
  }

  private async createAuditLog(
    action: string,
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    oldValues: any,
    newValues: any,
  ) {
    if (
      !event.metadata ||
      event.metadata.tableName === 'audit_logs' ||
      event.queryRunner?.isReleased
    ) {
      return;
    }

    const store = als.getStore();
    const userId = store?.get('userId');

    // recordId is tricky because it depends on the PK, assuming 'id' mostly
    const recordId = newValues?.id || oldValues?.id;
    if (!recordId) return;

    try {
      const auditLog = new AuditLog();
      auditLog.entityName = event.metadata.tableName;
      auditLog.recordId = recordId;
      auditLog.action = action;
      auditLog.oldValues = oldValues ? JSON.stringify(oldValues) : null;
      auditLog.newValues = newValues ? JSON.stringify(newValues) : null;
      auditLog.userId = userId || null;

      await event.manager.save(AuditLog, auditLog);
    } catch (error) {
      // Don't fail the transaction if audit log fails, just log it
      console.error('Failed to create audit log', error);
    }
  }
}
