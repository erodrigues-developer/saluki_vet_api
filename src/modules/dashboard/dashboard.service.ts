import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClinicSettingsService } from '../clinic-settings/clinic-settings.service';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { PetVaccinesService } from '../pet-vaccines/pet-vaccines.service';

type ChartItem = { date: string; label: string; value: number };
type BusinessHour = { start?: string | null; end?: string | null };

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly clinicSettingsService: ClinicSettingsService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly petVaccinesService: PetVaccinesService,
  ) {}

  async getOverview() {
    const settings = await this.clinicSettingsService.getSettings();
    const timezone = settings.timezone || 'America/Sao_Paulo';
    const now = new Date();
    const today = this.dateInTimeZone(now, timezone);
    const yesterday = this.addDays(today, -1);
    const fourteenDaysAgo = this.addDays(today, -13);
    const sevenDaysAgo = this.addDays(today, -6);
    const monthStart = `${today.slice(0, 7)}-01`;

    const [
      appointments,
      sales,
      vaccines,
      finance,
      consultations,
      attendance,
      procedureMix,
      openSales,
      stock,
      team,
    ] = await Promise.all([
      this.getAppointments(today, yesterday, timezone),
      this.getSales(today, yesterday, fourteenDaysAgo, monthStart, timezone),
      this.getVaccines(today, this.addDays(today, 7)),
      this.getFinance(today, monthStart),
      this.getConsultations(fourteenDaysAgo, today, timezone),
      this.getAttendance(sevenDaysAgo, today, timezone),
      this.getProcedureMix(monthStart, today, timezone),
      this.getOpenSales(),
      this.getCriticalStock(),
      this.getTeam(),
    ]);

    return {
      generatedAt: now.toISOString(),
      timezone,
      clinic: {
        ...this.resolveClinicStatus(settings.businessHoursJson, now, timezone),
        team,
      },
      today: {
        appointments,
        sales: sales.today,
        vaccines,
      },
      finance: {
        payables: finance.payables,
        expenseCategories: finance.expenseCategories,
        paymentForecast: finance.paymentForecast,
        revenueByDay: sales.revenueByDay,
        openSales,
      },
      operation: {
        consultationsLast14Days: consultations,
        attendanceLast7Days: attendance,
        procedureMix,
      },
      stock,
    };
  }

  private async getAppointments(today: string, yesterday: string, timezone: string) {
    const rows = await this.dataSource.query(
      `SELECT DATE(appointment.starts_at AT TIME ZONE 'UTC' AT TIME ZONE $1)::text AS date,
              appointment_type.id::text AS "typeId",
              appointment_type.name AS label,
              COUNT(*)::int AS value
         FROM appointments appointment
         JOIN appointment_types appointment_type ON appointment_type.id = appointment.appointment_type_id
         LEFT JOIN appointment_statuses status ON status.id = appointment.status_id
        WHERE DATE(appointment.starts_at AT TIME ZONE 'UTC' AT TIME ZONE $1) IN ($2::date, $3::date)
          AND COALESCE(status.code, '') <> 'CANCELED'
          AND appointment.deleted_at IS NULL
        GROUP BY DATE(appointment.starts_at AT TIME ZONE 'UTC' AT TIME ZONE $1), appointment_type.id, appointment_type.name
        ORDER BY value DESC, appointment_type.name ASC`,
      [timezone, yesterday, today],
    );

    const todayRows = rows.filter((row: any) => row.date === today);
    const total = todayRows.reduce((sum: number, row: any) => sum + Number(row.value), 0);
    const yesterdayTotal = rows
      .filter((row: any) => row.date === yesterday)
      .reduce((sum: number, row: any) => sum + Number(row.value), 0);

    return {
      total,
      comparisonPercentage: this.percentageChange(total, yesterdayTotal),
      byType: todayRows.map((row: any) => ({
        id: Number(row.typeId),
        label: row.label,
        value: Number(row.value),
      })),
    };
  }

  private async getSales(
    today: string,
    yesterday: string,
    trendStart: string,
    monthStart: string,
    timezone: string,
  ) {
    const [totals, receivedRows, trendRows, revenueRows] = await Promise.all([
      this.dataSource.query(
        `SELECT DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1)::text AS date,
                COUNT(*)::int AS count,
                COALESCE(SUM(sale.total_amount), 0)::numeric AS total
           FROM sales sale
          WHERE DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1) IN ($2::date, $3::date)
            AND sale.status <> 'CANCELED'
          GROUP BY DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1)`,
        [timezone, yesterday, today],
      ),
      this.dataSource.query(
        `SELECT COALESCE(SUM(payment.amount), 0)::numeric AS total
           FROM payments payment
          WHERE DATE(payment.paid_at AT TIME ZONE 'UTC' AT TIME ZONE $1) = $2::date`,
        [timezone, today],
      ),
      this.dataSource.query(
        `SELECT DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1)::text AS date,
                COALESCE(SUM(sale.total_amount), 0)::numeric AS value
           FROM sales sale
          WHERE DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1) BETWEEN $2::date AND $3::date
            AND sale.status <> 'CANCELED'
          GROUP BY DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1)
          ORDER BY date`,
        [timezone, trendStart, today],
      ),
      this.dataSource.query(
        `SELECT DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1)::text AS date,
                COALESCE(SUM(sale.total_amount), 0)::numeric AS value
           FROM sales sale
          WHERE DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1) BETWEEN $2::date AND $3::date
            AND sale.status <> 'CANCELED'
          GROUP BY DATE(sale.sale_date AT TIME ZONE 'UTC' AT TIME ZONE $1)
          ORDER BY date`,
        [timezone, monthStart, today],
      ),
    ]);

    const current = totals.find((row: any) => row.date === today) || {};
    const previous = totals.find((row: any) => row.date === yesterday) || {};
    const sold = Number(current.total || 0);
    const count = Number(current.count || 0);

    return {
      today: {
        sold,
        received: Number(receivedRows[0]?.total || 0),
        averageTicket: count ? sold / count : 0,
        comparisonPercentage: this.percentageChange(sold, Number(previous.total || 0)),
        trend: this.fillDateSeries(trendStart, today, trendRows),
      },
      revenueByDay: this.fillDateSeries(monthStart, today, revenueRows),
    };
  }

  private async getVaccines(today: string, upcomingEnd: string) {
    return this.petVaccinesService.getDueOverview(today, upcomingEnd);
  }

  private async getFinance(today: string, monthStart: string) {
    const [kpiRows, categoryRows, flowRows] = await Promise.all([
      this.dataSource.query(
        `SELECT
           COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::numeric AS "totalPending",
           COALESCE(SUM(COALESCE(paid_amount, amount)) FILTER (WHERE status = 'PAID'), 0)::numeric AS "totalPaid",
           COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING' AND due_date < $1::date), 0)::numeric AS "totalOverdue",
           COALESCE(SUM(amount) FILTER (WHERE status <> 'CANCELED'), 0)::numeric AS "expectedTotal"
         FROM accounts_payable
        WHERE due_date BETWEEN $2::date AND ($2::date + INTERVAL '1 month - 1 day')::date`,
        [today, monthStart],
      ),
      this.dataSource.query(
        `SELECT COALESCE(category, 'Sem Categoria') AS name, SUM(amount)::numeric AS value
           FROM accounts_payable
          WHERE due_date BETWEEN $1::date AND ($1::date + INTERVAL '1 month - 1 day')::date
            AND status <> 'CANCELED'
          GROUP BY COALESCE(category, 'Sem Categoria')
          ORDER BY value DESC`,
        [monthStart],
      ),
      this.dataSource.query(
        `SELECT due_date::text AS date,
                COALESCE(SUM(COALESCE(paid_amount, amount)) FILTER (WHERE status = 'PAID'), 0)::numeric AS paid,
                COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING' AND due_date >= $1::date), 0)::numeric AS pending,
                COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING' AND due_date < $1::date), 0)::numeric AS overdue
           FROM accounts_payable
          WHERE due_date BETWEEN $2::date AND ($2::date + INTERVAL '1 month - 1 day')::date
            AND status <> 'CANCELED'
          GROUP BY due_date
          ORDER BY due_date`,
        [today, monthStart],
      ),
    ]);

    const kpis = kpiRows[0] || {};
    return {
      payables: {
        totalPending: Number(kpis.totalPending || 0),
        totalPaid: Number(kpis.totalPaid || 0),
        totalOverdue: Number(kpis.totalOverdue || 0),
        expectedTotal: Number(kpis.expectedTotal || 0),
      },
      expenseCategories: categoryRows.map((row: any) => ({
        name: row.name,
        value: Number(row.value || 0),
      })),
      paymentForecast: flowRows.map((row: any) => ({
        date: row.date,
        paid: Number(row.paid || 0),
        pending: Number(row.pending || 0),
        overdue: Number(row.overdue || 0),
      })),
    };
  }

  private async getConsultations(start: string, end: string, timezone: string) {
    const rows = await this.dataSource.query(
      `SELECT DATE(consultation.visit_date AT TIME ZONE 'UTC' AT TIME ZONE $1)::text AS date,
              COUNT(*)::int AS value
         FROM consultations consultation
        WHERE DATE(consultation.visit_date AT TIME ZONE 'UTC' AT TIME ZONE $1) BETWEEN $2::date AND $3::date
        GROUP BY DATE(consultation.visit_date AT TIME ZONE 'UTC' AT TIME ZONE $1)
        ORDER BY date`,
      [timezone, start, end],
    );
    return this.fillDateSeries(start, end, rows);
  }

  private async getAttendance(start: string, end: string, timezone: string) {
    const rows = await this.dataSource.query(
      `SELECT DATE(appointment.starts_at AT TIME ZONE 'UTC' AT TIME ZONE $1)::text AS date,
              COUNT(*) FILTER (WHERE status.code IN ('IN_PROGRESS', 'COMPLETED'))::int AS attended,
              COUNT(*) FILTER (WHERE status.code = 'CANCELED')::int AS canceled,
              COUNT(*) FILTER (WHERE status.code IN ('NOSHOW', 'NO_SHOW'))::int AS missed
         FROM appointments appointment
         JOIN appointment_statuses status ON status.id = appointment.status_id
        WHERE DATE(appointment.starts_at AT TIME ZONE 'UTC' AT TIME ZONE $1) BETWEEN $2::date AND $3::date
          AND appointment.deleted_at IS NULL
        GROUP BY DATE(appointment.starts_at AT TIME ZONE 'UTC' AT TIME ZONE $1)
        ORDER BY date`,
      [timezone, start, end],
    );
    const byDate = new Map(rows.map((row: any) => [row.date, row]));
    return this.dateRange(start, end).map((date) => {
      const row: any = byDate.get(date) || {};
      return {
        date,
        attended: Number(row.attended || 0),
        canceled: Number(row.canceled || 0),
        missed: Number(row.missed || 0),
      };
    });
  }

  private async getProcedureMix(start: string, end: string, timezone: string) {
    const rows = await this.dataSource.query(
      `SELECT procedure.id::text AS id, procedure.name AS label,
              COALESCE(SUM(consultation_procedure.quantity), 0)::numeric AS value
         FROM consultation_procedures consultation_procedure
         JOIN procedures procedure ON procedure.id = consultation_procedure.procedure_id
         JOIN consultations consultation ON consultation.id = consultation_procedure.consultation_id
        WHERE DATE(consultation.visit_date AT TIME ZONE 'UTC' AT TIME ZONE $1) BETWEEN $2::date AND $3::date
        GROUP BY procedure.id, procedure.name
        ORDER BY value DESC, procedure.name ASC`,
      [timezone, start, end],
    );
    return rows.map((row: any) => ({
      id: Number(row.id),
      label: row.label,
      value: Number(row.value || 0),
    }));
  }

  private async getOpenSales() {
    const [summaryRows, itemRows] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(total_amount), 0)::numeric AS total
           FROM sales WHERE status = 'OPEN'`,
      ),
      this.dataSource.query(
        `SELECT id::text, total_amount::numeric AS amount, sale_date AS "saleDate"
           FROM sales WHERE status = 'OPEN'
          ORDER BY sale_date ASC, id ASC LIMIT 3`,
      ),
    ]);
    return {
      count: Number(summaryRows[0]?.count || 0),
      totalPending: Number(summaryRows[0]?.total || 0),
      items: itemRows.map((row: any) => ({
        id: Number(row.id),
        amount: Number(row.amount || 0),
        saleDate: row.saleDate,
      })),
    };
  }

  private async getCriticalStock() {
    const response = await this.stockMovementsService.getStockBalance({
      manager: this.dataSource.manager,
      page: 1,
      limit: 5,
      status: 'LOW',
    });
    return {
      criticalCount: Number(response.meta?.total || 0),
      items: response.data || [],
    };
  }

  private async getTeam() {
    const rows = await this.dataSource.query(
      `SELECT role.code, COUNT(DISTINCT app_user.id)::int AS count
         FROM users app_user
         JOIN user_roles user_role ON user_role.user_id = app_user.id
         JOIN roles role ON role.id = user_role.role_id
        WHERE app_user.is_active = true
          AND app_user.deleted_at IS NULL
          AND role.code IN ('VETERINARIAN', 'VET', 'RECEPTIONIST')
        GROUP BY role.code`,
    );
    const counts = new Map(rows.map((row: any) => [row.code, Number(row.count)]));
    return {
      veterinarians: Number(counts.get('VETERINARIAN') || counts.get('VET') || 0),
      receptionists: Number(counts.get('RECEPTIONIST') || 0),
    };
  }

  private resolveClinicStatus(raw: string | null | undefined, now: Date, timezone: string) {
    if (!raw) return { status: 'UNCONFIGURED', closesAt: null };
    try {
      const schedule = JSON.parse(raw) as Record<string, Array<BusinessHour | string>>;
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(now);
      const weekday = parts.find((part) => part.type === 'weekday')?.value.toLowerCase();
      const dayKey = weekday?.slice(0, 3) || '';
      const hour = parts.find((part) => part.type === 'hour')?.value || '00';
      const minute = parts.find((part) => part.type === 'minute')?.value || '00';
      const currentTime = `${hour}:${minute}`;
      const legacyDayKeys: Record<string, string> = {
        mon: 'seg', tue: 'ter', wed: 'qua', thu: 'qui', fri: 'sex', sat: 'sab', sun: 'dom',
      };
      const rawIntervals = schedule[dayKey] || schedule[legacyDayKeys[dayKey]] || [];
      const intervals: BusinessHour[] = (Array.isArray(rawIntervals) ? rawIntervals : [])
        .map((interval: BusinessHour | string) => {
          if (typeof interval !== 'string') return interval;
          const [start, end] = interval.split('-');
          return { start, end };
        });
      const active = intervals.find(
        (interval) => interval.start && interval.end && currentTime >= interval.start && currentTime <= interval.end,
      );
      return {
        status: active ? 'OPEN' : 'CLOSED',
        closesAt: active?.end || intervals.at(-1)?.end || null,
      };
    } catch {
      return { status: 'UNCONFIGURED', closesAt: null };
    }
  }

  private percentageChange(current: number, previous: number) {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 100);
  }

  private fillDateSeries(start: string, end: string, rows: any[]): ChartItem[] {
    const values = new Map(rows.map((row: any) => [row.date, Number(row.value || 0)]));
    return this.dateRange(start, end).map((date) => ({
      date,
      label: this.shortDateLabel(date),
      value: values.get(date) || 0,
    }));
  }

  private dateRange(start: string, end: string) {
    const dates: string[] = [];
    for (let date = start; date <= end; date = this.addDays(date, 1)) dates.push(date);
    return dates;
  }

  private addDays(date: string, amount: number) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + amount);
    return value.toISOString().slice(0, 10);
  }

  private dateInTimeZone(date: Date, timezone: string) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private shortDateLabel(date: string) {
    const [, month, day] = date.split('-');
    return `${day}/${month}`;
  }
}
