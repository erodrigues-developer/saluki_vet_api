import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-16T15:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('returns a complete zero-state overview using the clinic timezone', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([]),
      manager: {},
    } as any;
    const clinicSettingsService = {
      getSettings: jest.fn().mockResolvedValue({
        timezone: 'America/Sao_Paulo',
        businessHoursJson: JSON.stringify({
          wed: [{ start: '08:00', end: '20:00' }],
        }),
      }),
    } as any;
    const stockMovementsService = {
      getStockBalance: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
      }),
    } as any;
    const petVaccinesService = {
      getDueOverview: jest.fn().mockResolvedValue({
        today: 0,
        overdue: 0,
        upcoming: 0,
        items: [],
      }),
    } as any;

    const service = new DashboardService(
      dataSource,
      clinicSettingsService,
      stockMovementsService,
      petVaccinesService,
    );

    const result = await service.getOverview();

    expect(result.timezone).toBe('America/Sao_Paulo');
    expect(result.clinic.status).toBe('OPEN');
    expect(result.clinic.closesAt).toBe('20:00');
    expect(result.today.appointments.total).toBe(0);
    expect(result.today.sales.sold).toBe(0);
    expect(result.today.vaccines).toEqual({
      today: 0,
      overdue: 0,
      upcoming: 0,
      items: [],
    });
    expect(result.operation.consultationsLast14Days).toHaveLength(14);
    expect(result.operation.attendanceLast7Days).toHaveLength(7);
    expect(result.stock.criticalCount).toBe(0);
  });
});
