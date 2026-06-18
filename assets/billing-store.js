var BillingStore = (function () {
  var KEY = "poc_billing_v11";

  function defaultData() {
    return {
      companies: [
        { id: "emp1", client_code: "CLI-001", name: "Transportes Rápido Ltda", cnpj: "12.345.678/0001-90", email: "financeiro@rapidotransportes.com.br" },
        { id: "emp2", client_code: "CLI-002", name: "Logística Sul S.A.", cnpj: "98.765.432/0001-10", email: "contas@logisticasul.com.br" },
        { id: "emp3", client_code: "CLI-003", name: "Frota Comercial ME", cnpj: "11.222.333/0001-44", email: "financeiro@frotacomercial.com.br" },
        { id: "emp4", client_code: "CLI-004", name: "Operações Norte Ltda", cnpj: "55.666.777/0001-88", email: "faturamento@operacoesnorte.com.br" }
      ],
      customers: [
        { id: "cli1", name: "João Silva — Frota Caminhões", email: "financeiro@rapidotransportes.com.br" },
        { id: "cli2", name: "Maria Costa — Comercial", email: "contas@logisticasul.com.br" },
        { id: "cli3", name: "Carlos Mendes — Operacional", email: "faturamento@operacoesnorte.com.br" }
      ],
      fleets: [
        { id: "fr1", company_id: "emp1", name: "Frota Caminhões" },
        { id: "fr2", company_id: "emp2", name: "Frota Comercial" },
        { id: "fr3", company_id: "emp3", name: "Frota Leve" },
        { id: "fr4", company_id: "emp1", name: "Frota Terceirizados" },
        { id: "fr5", company_id: "emp4", name: "Frota Operacional" }
      ],
      configurations: [
        {
          id: "cfg1",
          name: "Mensal - Frota Caminhões",
          subtitle: "Faturamento mensal padrão",
          charge_type: "only_invoiced_sales",
          billing_period: "monthly",
          period_start_day: null,
          period_end_day: null,
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: null,
          due_days_after_period: 10,
          block_on_overdue: true,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: "Desconto especial por produto acordado em contrato.",
          discount_rules: [
            { id: "dr1", target_type: "product", target_name: "Diesel S10", discount_type: "fixed_per_unit", discount_unit: "L", discount_value: 0.02, priority: 1 },
            { id: "dr2", target_type: "product", target_name: "Gasolina Comum", discount_type: "percentage", discount_unit: null, discount_value: 1.0, priority: 2 }
          ],
          deleted_at: null
        },
        {
          id: "cfg2",
          name: "Quinzenal - Frota Comercial",
          subtitle: "Cobrança quinzenal",
          charge_type: "invoiced_and_immediate",
          billing_period: "biweekly",
          period_start_day: null,
          period_end_day: null,
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: 30000,
          due_days_after_period: 7,
          block_on_overdue: false,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: "",
          deleted_at: null
        },
        {
          id: "cfg3",
          name: "Semanal - Operacional",
          subtitle: "Fechamento semanal",
          charge_type: "only_invoiced_sales",
          billing_period: "weekly",
          period_start_day: null,
          period_end_day: null,
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: 12000,
          due_days_after_period: 5,
          block_on_overdue: false,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: "",
          deleted_at: null
        },
        {
          id: "cfg4",
          name: "Personalizado - Parceiros",
          subtitle: "Período customizado (dia 5 a 4)",
          charge_type: "invoiced_and_immediate",
          billing_period: "custom",
          period_start_day: 5,
          period_end_day: 4,
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: null,
          due_days_after_period: 15,
          block_on_overdue: true,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: "",
          deleted_at: null
        },
        {
          id: "cfg5",
          name: "Mensal - Frota Leve",
          subtitle: "Configuração inativa (vigência 2025)",
          charge_type: "only_invoiced_sales",
          billing_period: "monthly",
          period_start_day: null,
          period_end_day: null,
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: null,
          due_days_after_period: 10,
          block_on_overdue: false,
          valid_from: "2025-01-01",
          valid_until: "2025-12-31",
          status: "inactive",
          notes: "",
          deleted_at: null
        }
      ],
      links: [
        { id: "lnk1", configuration_id: "cfg1", customer_id: "cli1", company_id: "emp1", fleet_id: "fr1", specific_adjustment_type: "none", specific_adjustment_mode: "percentage", specific_adjustment_value: 0, specific_credit_limit: null, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active",
          discount_rules: [
            { id: "dr_lnk1_1", target_type: "product", target_name: "Diesel S10", discount_type: "fixed_per_unit", discount_unit: "L", discount_value: 0.02, priority: 1 }
          ]
        },
        { id: "lnk2", configuration_id: "cfg1", customer_id: "cli1", company_id: "emp1", fleet_id: "fr4", specific_adjustment_type: "increase", specific_adjustment_mode: "percentage", specific_adjustment_value: 1, specific_credit_limit: null, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active", discount_rules: [] },
        { id: "lnk3", configuration_id: "cfg1", customer_id: "cli2", company_id: "emp2", fleet_id: "fr2", specific_adjustment_type: "none", specific_adjustment_mode: "percentage", specific_adjustment_value: 0, specific_credit_limit: 20000, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active",
          discount_rules: [
            { id: "dr_lnk3_1", target_type: "product", target_name: "Diesel S10", discount_type: "fixed_per_unit", discount_unit: "L", discount_value: 0.03, priority: 1 },
            { id: "dr_lnk3_2", target_type: "category", target_name: "Combustíveis", discount_type: "percentage", discount_unit: "L", discount_value: 1.5, priority: 2 }
          ]
        },
        { id: "lnk4", configuration_id: "cfg1", customer_id: "cli3", company_id: "emp3", fleet_id: "fr3", specific_adjustment_type: "discount", specific_adjustment_mode: "fixed_amount", specific_adjustment_value: 150, specific_credit_limit: null, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active", discount_rules: [] },
        { id: "lnk5", configuration_id: "cfg2", customer_id: "cli2", company_id: "emp2", fleet_id: "fr2", specific_adjustment_type: "none", specific_adjustment_mode: "percentage", specific_adjustment_value: 0, specific_credit_limit: null, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active", discount_rules: [] },
        { id: "lnk6", configuration_id: "cfg3", customer_id: "cli3", company_id: "emp4", fleet_id: "fr5", specific_adjustment_type: "none", specific_adjustment_mode: "percentage", specific_adjustment_value: 0, specific_credit_limit: 8000, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active", discount_rules: [] }
      ],
      cycles: [
        {
          id: "cyc1", billing_code: "FAT-202605-001",
          configuration_id: "cfg1", link_id: "lnk1", customer_id: "cli1", company_id: "emp1", fleet_id: "fr1",
          reference_start: "2026-05-01", reference_end: "2026-05-31", due_date: "2026-06-15",
          status: "open", gross_amount: 13150.5, discount_amount: 0, increase_amount: 0, net_amount: 13150.5,
          invoice_count: 3, manual_adjustment_note: "", adjusted_by: null, adjusted_at: null,
          boleto_id: null, portal_link: "", sent_at: null, last_sent_at: null, closed_at: null, canceled_at: null
        },
        {
          id: "cyc2", billing_code: "FAT-202605-002",
          configuration_id: "cfg1", link_id: "lnk2", customer_id: "cli1", company_id: "emp1", fleet_id: "fr4",
          reference_start: "2026-05-01", reference_end: "2026-05-31", due_date: "2026-06-15",
          status: "open", gross_amount: 7620, discount_amount: 0, increase_amount: 76.2, net_amount: 7696.2,
          invoice_count: 2, manual_adjustment_note: "", adjusted_by: null, adjusted_at: null,
          boleto_id: null, portal_link: "", sent_at: null, last_sent_at: null, closed_at: null, canceled_at: null
        },
        {
          id: "cyc3", billing_code: "FAT-202605-003",
          configuration_id: "cfg1", link_id: "lnk3", customer_id: "cli2", company_id: "emp2", fleet_id: "fr2",
          reference_start: "2026-05-01", reference_end: "2026-05-31", due_date: "2026-06-15",
          status: "open", gross_amount: 11280, discount_amount: 0, increase_amount: 0, net_amount: 11280,
          invoice_count: 3, manual_adjustment_note: "", adjusted_by: null, adjusted_at: null,
          boleto_id: null, portal_link: "", sent_at: null, last_sent_at: null, closed_at: null, canceled_at: null
        },
        {
          id: "cyc4", billing_code: "FAT-202605-004",
          configuration_id: "cfg1", link_id: "lnk4", customer_id: "cli3", company_id: "emp3", fleet_id: "fr3",
          reference_start: "2026-05-01", reference_end: "2026-05-31", due_date: "2026-06-15",
          status: "open", gross_amount: 4500, discount_amount: 150, increase_amount: 0, net_amount: 4350,
          invoice_count: 2, manual_adjustment_note: "Desconto contratual", adjusted_by: "Sistema", adjusted_at: "2026-06-01T08:00:00",
          boleto_id: null, portal_link: "", sent_at: null, last_sent_at: null, closed_at: null, canceled_at: null
        },
        {
          id: "cyc5", billing_code: "FAT-202606-001",
          configuration_id: "cfg2", link_id: "lnk5", customer_id: "cli2", company_id: "emp2", fleet_id: "fr2",
          reference_start: "2026-06-01", reference_end: "2026-06-15", due_date: "2026-06-25",
          status: "open", gross_amount: 6840, discount_amount: 0, increase_amount: 0, net_amount: 6840,
          invoice_count: 2, manual_adjustment_note: "", adjusted_by: null, adjusted_at: null,
          boleto_id: null, portal_link: "", sent_at: null, last_sent_at: null, closed_at: null, canceled_at: null
        },
        {
          id: "cyc6", billing_code: "FAT-202606-002",
          configuration_id: "cfg3", link_id: "lnk6", customer_id: "cli3", company_id: "emp4", fleet_id: "fr5",
          reference_start: "2026-06-09", reference_end: "2026-06-15", due_date: "2026-06-22",
          status: "open", gross_amount: 3244.5, discount_amount: 0, increase_amount: 0, net_amount: 3244.5,
          invoice_count: 2, manual_adjustment_note: "", adjusted_by: null, adjusted_at: null,
          boleto_id: null, portal_link: "", sent_at: null, last_sent_at: null, closed_at: null, canceled_at: null
        },
        {
          id: "cyc7", billing_code: "FAT-202604-001",
          configuration_id: "cfg1", link_id: "lnk1", customer_id: "cli1", company_id: "emp1", fleet_id: "fr1",
          reference_start: "2026-04-01", reference_end: "2026-04-30", due_date: "2026-05-10",
          status: "sent", gross_amount: 8160, discount_amount: 0, increase_amount: 163.2, net_amount: 8323.2,
          invoice_count: 2, manual_adjustment_note: "", adjusted_by: null, adjusted_at: null,
          boleto_id: "BLT-0407", portal_link: "https://portal.demo.ecomercial/emp1/fat-2026-04",
          sent_at: "2026-05-08T14:32:00", last_sent_at: "2026-05-08T14:32:00",
          closed_at: "2026-05-07T16:15:00", canceled_at: null
        },
        {
          id: "cyc8", billing_code: "FAT-202604-002",
          configuration_id: "cfg3", link_id: "lnk6", customer_id: "cli3", company_id: "emp4", fleet_id: "fr5",
          reference_start: "2026-04-01", reference_end: "2026-04-30", due_date: "2026-05-15",
          status: "closed", gross_amount: 9850, discount_amount: 50, increase_amount: 0, net_amount: 9800,
          invoice_count: 5, manual_adjustment_note: "Desconto por divergência de nota", adjusted_by: "Admin", adjusted_at: "2026-05-02T09:30:00",
          boleto_id: "BLT-0408", portal_link: "https://portal.demo.ecomercial/emp4/fat-2026-04",
          sent_at: null, last_sent_at: null, closed_at: "2026-05-02T10:00:00", canceled_at: null
        },
        {
          id: "cyc9", billing_code: "FAT-202604-003",
          configuration_id: "cfg2", link_id: "lnk5", customer_id: "cli2", company_id: "emp2", fleet_id: "fr2",
          reference_start: "2026-04-16", reference_end: "2026-04-30", due_date: "2026-05-05",
          status: "sent", gross_amount: 2100, discount_amount: 0, increase_amount: 0, net_amount: 2100,
          invoice_count: 1, manual_adjustment_note: "Fechamento antecipado a pedido do cliente (período encerrava 30/04)", adjusted_by: "Admin", adjusted_at: "2026-04-22T11:00:00",
          boleto_id: "BLT-0409", portal_link: "https://portal.demo.ecomercial/emp2/fat-2026-04b",
          sent_at: "2026-04-22T11:05:00", last_sent_at: "2026-04-22T11:05:00",
          closed_at: "2026-04-22T11:00:00", canceled_at: null
        }
      ],
      cycle_items: [
        { id: "ci1",  cycle_id: "cyc1", nfe_number: "00012458", nfe_series: "1", nfe_key: "35260512451234567890123456789012345678901234", issue_date: "2026-05-05", plate: "ABC-1D23", driver: "Pedro Santos",  product: "Diesel S10",      quantity: 700, unit_price: 6.00, gross_amount: 4200.00, net_amount: 4200.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci2",  cycle_id: "cyc1", nfe_number: "00012459", nfe_series: "1", nfe_key: "35260512451234567890123456789012345678901235", issue_date: "2026-05-12", plate: "DEF-4G56", driver: "Lucas Lima",   product: "Diesel S10",      quantity: 641, unit_price: 6.00, gross_amount: 3846.00, net_amount: 3846.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci3",  cycle_id: "cyc1", nfe_number: "00012460", nfe_series: "1", nfe_key: "35260512451234567890123456789012345678901236", issue_date: "2026-05-20", plate: "GHI-7J89", driver: "Pedro Santos",  product: "Gasolina Comum",  quantity: 851, unit_price: 6.00, gross_amount: 5104.50, net_amount: 5104.50, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci10", cycle_id: "cyc2", nfe_number: "00012501", nfe_series: "1", nfe_key: "35260512501234567890123456789012345678901250", issue_date: "2026-05-07", plate: "JKL-0M12", driver: "Carlos Moura",  product: "Diesel S10",      quantity: 720, unit_price: 5.90, gross_amount: 4248.00, net_amount: 4248.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci11", cycle_id: "cyc2", nfe_number: "00012502", nfe_series: "1", nfe_key: "35260512501234567890123456789012345678901251", issue_date: "2026-05-18", plate: "MNO-3P45", driver: "Carlos Moura",  product: "Diesel S10",      quantity: 570, unit_price: 5.90, gross_amount: 3372.00, net_amount: 3372.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci12", cycle_id: "cyc3", nfe_number: "00013101", nfe_series: "1", nfe_key: "35260513101234567890123456789012345678901310", issue_date: "2026-05-03", plate: "PQR-6S78", driver: "Roberto Alves", product: "Diesel S10",      quantity: 800, unit_price: 5.90, gross_amount: 4720.00, net_amount: 4720.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci13", cycle_id: "cyc3", nfe_number: "00013102", nfe_series: "1", nfe_key: "35260513101234567890123456789012345678901311", issue_date: "2026-05-14", plate: "STU-9T01", driver: "Roberto Alves", product: "Gasolina Comum",  quantity: 650, unit_price: 6.00, gross_amount: 3900.00, net_amount: 3900.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci14", cycle_id: "cyc3", nfe_number: "00013103", nfe_series: "1", nfe_key: "35260513101234567890123456789012345678901312", issue_date: "2026-05-22", plate: "PQR-6S78", driver: "Ana Ferreira",  product: "Diesel S10",      quantity: 440, unit_price: 5.90, gross_amount: 2660.00, net_amount: 2660.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci15", cycle_id: "cyc4", nfe_number: "00013201", nfe_series: "1", nfe_key: "35260513201234567890123456789012345678901320", issue_date: "2026-05-09", plate: "VWX-2Y34", driver: "Fernando Luz",  product: "Diesel S10",      quantity: 400, unit_price: 5.80, gross_amount: 2320.00, net_amount: 2320.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci16", cycle_id: "cyc4", nfe_number: "00013202", nfe_series: "1", nfe_key: "35260513201234567890123456789012345678901321", issue_date: "2026-05-23", plate: "YZA-5B67", driver: "Fernando Luz",  product: "Gasolina Comum",  quantity: 363, unit_price: 6.00, gross_amount: 2180.00, net_amount: 2180.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci17", cycle_id: "cyc5", nfe_number: "00013501", nfe_series: "1", nfe_key: "35260613501234567890123456789012345678901350", issue_date: "2026-06-03", plate: "PQR-6S78", driver: "Roberto Alves", product: "Diesel S10",      quantity: 620, unit_price: 5.90, gross_amount: 3658.00, net_amount: 3658.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci18", cycle_id: "cyc5", nfe_number: "00013502", nfe_series: "1", nfe_key: "35260613501234567890123456789012345678901351", issue_date: "2026-06-10", plate: "STU-9T01", driver: "Ana Ferreira",  product: "Diesel S10",      quantity: 540, unit_price: 5.90, gross_amount: 3186.00, net_amount: 3186.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci20", cycle_id: "cyc6", nfe_number: "00014001", nfe_series: "1", nfe_key: "35260614001234567890123456789012345678901400", issue_date: "2026-06-09", plate: "BCD-2E34", driver: "Marcos Vinicius", product: "Diesel S10",      quantity: 300, unit_price: 5.80, gross_amount: 1740.00, net_amount: 1740.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci21", cycle_id: "cyc6", nfe_number: "00014002", nfe_series: "1", nfe_key: "35260614001234567890123456789012345678901401", issue_date: "2026-06-12", plate: "EFG-5H67", driver: "Sandro Melo",     product: "Diesel S10",      quantity: 255, unit_price: 5.90, gross_amount: 1504.50, net_amount: 1504.50, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci19", cycle_id: "cyc6", nfe_number: "00013601", nfe_series: "1", nfe_key: "35260613601234567890123456789012345678901360", issue_date: "2026-06-10", plate: "MNO-3P45", driver: "José Oliveira",  product: "Diesel S10",      quantity: 310, unit_price: 5.80, gross_amount: 1798.00, net_amount: 1798.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci20", cycle_id: "cyc6", nfe_number: "00013602", nfe_series: "1", nfe_key: "35260613601234567890123456789012345678901361", issue_date: "2026-06-13", plate: "ABC-8C90", driver: "José Oliveira",  product: "Diesel Aditivado", quantity: 250, unit_price: 5.77, gross_amount: 1442.00, net_amount: 1442.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci4",  cycle_id: "cyc7", nfe_number: "00012301", nfe_series: "1", nfe_key: "35260412301234567890123456789012345678901201", issue_date: "2026-04-08", plate: "ABC-1D23", driver: "Pedro Santos",  product: "Diesel S10",      quantity: 633, unit_price: 6.00, gross_amount: 3800.00, net_amount: 3800.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci5",  cycle_id: "cyc7", nfe_number: "00012302", nfe_series: "1", nfe_key: "35260412301234567890123456789012345678901202", issue_date: "2026-04-15", plate: "JKL-0M12", driver: "Lucas Lima",   product: "Diesel S10",      quantity: 700, unit_price: 6.00, gross_amount: 4200.00, net_amount: 4200.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci6",  cycle_id: "cyc8", nfe_number: "00009801", nfe_series: "1", nfe_key: "35260409801234567890123456789012345678900980", issue_date: "2026-04-04", plate: "MNO-3P45", driver: "José Oliveira",  product: "Diesel S10",      quantity: 500, unit_price: 5.80, gross_amount: 2900.00, net_amount: 2900.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci7",  cycle_id: "cyc8", nfe_number: "00009802", nfe_series: "1", nfe_key: "35260409801234567890123456789012345678900981", issue_date: "2026-04-10", plate: "PQR-6S78", driver: "Antonio Silva",  product: "Diesel S10",      quantity: 400, unit_price: 5.80, gross_amount: 2320.00, net_amount: 2320.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci8",  cycle_id: "cyc8", nfe_number: "00009803", nfe_series: "1", nfe_key: "35260409801234567890123456789012345678900982", issue_date: "2026-04-17", plate: "MNO-3P45", driver: "José Oliveira",  product: "Diesel Aditivado", quantity: 300, unit_price: 6.10, gross_amount: 1830.00, net_amount: 1830.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci9",  cycle_id: "cyc8", nfe_number: "00009804", nfe_series: "1", nfe_key: "35260409801234567890123456789012345678900983", issue_date: "2026-04-22", plate: "STU-9T01", driver: "José Oliveira",  product: "Diesel S10",      quantity: 250, unit_price: 5.80, gross_amount: 1450.00, net_amount: 1450.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci21", cycle_id: "cyc8", nfe_number: "00009805", nfe_series: "1", nfe_key: "35260409801234567890123456789012345678900984", issue_date: "2026-04-28", plate: "ABC-8C90", driver: "Antonio Silva",  product: "Gasolina Comum",  quantity: 225, unit_price: 6.00, gross_amount: 1350.00, net_amount: 1350.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null },
        { id: "ci22", cycle_id: "cyc9", nfe_number: "00011101", nfe_series: "1", nfe_key: "35260411101234567890123456789012345678901110", issue_date: "2026-04-18", plate: "VWX-2Y34", driver: "Marcos Costa",   product: "Diesel S10",      quantity: 350, unit_price: 6.00, gross_amount: 2100.00, net_amount: 2100.00, status: "active", manually_added: false, added_by: "Sistema", removed_at: null, removed_by: null }
      ],
      send_logs: [
        { id: "sl1", cycle_id: "cyc7", email_to: "financeiro@rapidotransportes.com.br",  subject: "Fatura FAT-202604-001",            portal_link: "https://portal.demo.ecomercial/emp1/fat-2026-04",  sent_at: "2026-05-08T14:32:00", status: "success", sent_by: "Admin", error_message: null },
        { id: "sl2", cycle_id: "cyc9", email_to: "contas@logisticasul.com.br",           subject: "Fatura FAT-202604-003 (Antecipada)", portal_link: "https://portal.demo.ecomercial/emp2/fat-2026-04b", sent_at: "2026-04-22T11:05:00", status: "success", sent_by: "Admin", error_message: null }
      ],
      cycle_advances: [
        { id: "adv1", cycle_id: "cyc1", amount: 4000, note: "Adiantamento solicitado pelo cliente — referente ao consumo de maio", registered_by: "Admin", registered_at: "2026-06-05T10:30:00" }
      ],
      history: [
        { id: "h1",  cycle_id: "cyc1", action: "created",  at: "2026-06-01T08:00:00", user: "Sistema", detail: "Faturamento gerado automaticamente para o vínculo lnk1" },
        { id: "h10", cycle_id: "cyc2", action: "created",  at: "2026-06-01T08:00:00", user: "Sistema", detail: "Faturamento gerado automaticamente para o vínculo lnk2" },
        { id: "h11", cycle_id: "cyc3", action: "created",  at: "2026-06-01T08:00:00", user: "Sistema", detail: "Faturamento gerado automaticamente para o vínculo lnk3" },
        { id: "h12", cycle_id: "cyc4", action: "created",  at: "2026-06-01T08:00:00", user: "Sistema", detail: "Faturamento gerado automaticamente para o vínculo lnk4" },
        { id: "h13", cycle_id: "cyc4", action: "adjustment", at: "2026-06-01T08:05:00", user: "Sistema", detail: "Desconto contratual de R$ 150,00 aplicado (vínculo lnk4)" },
        { id: "h14", cycle_id: "cyc5", action: "created",  at: "2026-06-01T08:00:00", user: "Sistema", detail: "Faturamento gerado automaticamente para o vínculo lnk5" },
        { id: "h15", cycle_id: "cyc6", action: "created",  at: "2026-06-09T08:00:00", user: "Sistema", detail: "Faturamento gerado automaticamente para o vínculo lnk6" },
        { id: "h15", cycle_id: "cyc6", action: "created",  at: "2026-06-09T08:00:00", user: "Sistema", detail: "Faturamento gerado automaticamente para o vínculo lnk6" },
        { id: "h2", cycle_id: "cyc7", action: "closed", at: "2026-05-07T16:15:00", user: "Admin", detail: "Faturamento fechado — 2 notas" },
        { id: "h3", cycle_id: "cyc7", action: "sent", at: "2026-05-08T14:32:00", user: "Admin", detail: "E-mail enviado com link do portal" },
        { id: "h4", cycle_id: "cyc9", action: "closed", at: "2026-04-22T11:00:00", user: "Admin", detail: "Fechamento antecipado — período encerrava em 30/04. Vendas posteriores incorporadas ao próximo faturamento." },
        { id: "h5", cycle_id: "cyc9", action: "sent",   at: "2026-04-22T11:05:00", user: "Admin", detail: "Fatura enviada para contas@logisticasul.com.br" },
        { id: "h6", cycle_id: "cyc1", action: "advance", at: "2026-06-05T10:30:00", user: "Admin",   detail: "Adiantamento de R$ 4.000,00 registrado. Justificativa: Adiantamento solicitado pelo cliente — referente ao consumo de maio" }
      ]
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return defaultData();
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getData() { return load(); }
  function setData(data) { save(data); }
  function reset() { save(defaultData()); }
  function uid(p) { return p + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000); }

  function companyById(id) {
    return load().companies.filter(function (x) { return x.id === id; })[0];
  }
  function customerById(id) {
    return load().customers.filter(function (x) { return x.id === id; })[0];
  }
  function fleetById(id) {
    return load().fleets.filter(function (x) { return x.id === id; })[0];
  }
  function configById(id) {
    return load().configurations.filter(function (x) { return x.id === id; })[0];
  }
  function linksForConfig(configId) {
    return load().links.filter(function (l) { return l.configuration_id === configId; });
  }
  function linkById(id) {
    return load().links.filter(function (l) { return l.id === id; })[0];
  }
  function fleetsForCompany(companyId) {
    return load().fleets.filter(function (f) { return f.company_id === companyId; });
  }
  function fleetBelongsToCompany(fleetId, companyId) {
    var f = fleetById(fleetId);
    return !!(f && f.company_id === companyId);
  }

  function linkIsActive(link, data) {
    if (!link || link.status !== "active") return false;
    data = data || load();
    var cfg = data.configurations.filter(function (x) { return x.id === link.configuration_id; })[0];
    return !!(cfg && cfg.status === "active" && !cfg.deleted_at);
  }
  function activeLinks(data) {
    data = data || load();
    return data.links.filter(function (l) { return linkIsActive(l, data); });
  }

  function findDuplicateLink(configId, customerId, companyId, fleetId, excludeId) {
    return load().links.filter(function (l) {
      return l.configuration_id === configId &&
        l.customer_id === customerId &&
        l.company_id === companyId &&
        l.fleet_id === fleetId &&
        l.status === "active" &&
        l.id !== excludeId;
    })[0];
  }

  function validateConfiguration(cfg, excludeId) {
    if (!cfg.name || !String(cfg.name).trim()) return "Nome do faturamento é obrigatório.";
    if (!cfg.charge_type) return "Tipo de cobrança é obrigatório.";
    if (!cfg.billing_period) return "Período de cobrança é obrigatório.";
    if (cfg.billing_period === "custom") {
      var sd = parseInt(cfg.period_start_day, 10);
      var ed = parseInt(cfg.period_end_day, 10);
      if (isNaN(sd) || sd < 1 || sd > 31) return "Dia inicial deve estar entre 1 e 31.";
      if (isNaN(ed) || ed < 1 || ed > 31) return "Dia final deve estar entre 1 e 31.";
    }
    if (!cfg.valid_from) return "Data inicial de vigência é obrigatória.";
    if (!cfg.valid_until) return "Data final de vigência é obrigatória.";
    if (cfg.valid_until < cfg.valid_from) return "Vigência final deve ser maior ou igual à inicial.";
    if (!cfg.status) return "Status é obrigatório.";
    if (cfg.credit_limit !== null && cfg.credit_limit !== undefined && cfg.credit_limit !== "" && Number(cfg.credit_limit) < 0) {
      return "Limite de crédito deve ser zero ou positivo.";
    }
    var dueDays = parseInt(cfg.due_days_after_period, 10);
    if (isNaN(dueDays) || dueDays < 1 || dueDays > 365) return "Vencimento deve ser entre 1 e 365 dias.";

    var dup = load().configurations.filter(function (c) {
      return c.id !== excludeId && !c.deleted_at && c.name.toLowerCase() === String(cfg.name).trim().toLowerCase();
    })[0];
    if (dup) return "Já existe configuração com este nome.";
    return null;
  }

  function validateLink(link, excludeId) {
    if (!link.company_id) return "Empresa é obrigatória.";
    if (!link.fleet_id) return "Frota / centro de cobrança é obrigatório.";
    if (!fleetBelongsToCompany(link.fleet_id, link.company_id)) {
      return "A frota selecionada não pertence à empresa.";
    }
    if (!link.valid_from) return "Data inicial do vínculo é obrigatória.";
    if (link.valid_until && link.valid_until < link.valid_from) {
      return "Vigência final do vínculo deve ser maior ou igual à inicial.";
    }
    var adjVal = Number(link.specific_adjustment_value || 0);
    if (adjVal < 0) return "Valor do ajuste específico deve ser zero ou positivo.";
    if (link.specific_adjustment_type !== "none" && link.specific_adjustment_mode === "percentage" && adjVal > 100) {
      return "Percentual do ajuste deve estar entre 0 e 100.";
    }
    if (link.specific_credit_limit !== null && link.specific_credit_limit !== undefined && link.specific_credit_limit !== "" && Number(link.specific_credit_limit) < 0) {
      return "Limite específico deve ser zero ou positivo.";
    }
    if (link.status === "active") {
      var dup = load().links.filter(function (l) {
        return l.configuration_id === link.configuration_id &&
          l.company_id === link.company_id &&
          l.fleet_id === link.fleet_id &&
          l.status === "active" &&
          l.id !== excludeId;
      })[0];
      if (dup) return "Já existe vínculo ativo com esta empresa e frota nesta configuração.";
    }
    return null;
  }

  function effectiveAdjustment(cycle, link, cfg) {
    if (cycle && (Number(cycle.discount_amount) > 0 || Number(cycle.increase_amount) > 0) && cycle.adjusted_at) {
      return { source: "manual" };
    }
    if (link && link.specific_adjustment_type !== "none" && Number(link.specific_adjustment_value) > 0) {
      return { source: "link", type: link.specific_adjustment_type, mode: link.specific_adjustment_mode, value: link.specific_adjustment_value };
    }
    return { source: "none" };
  }

  function effectiveCreditLimit(link, cfg) {
    if (link && link.specific_credit_limit !== null && link.specific_credit_limit !== undefined && link.specific_credit_limit !== "") {
      return Number(link.specific_credit_limit);
    }
    if (cfg && cfg.credit_limit !== null && cfg.credit_limit !== undefined && cfg.credit_limit !== "") {
      return Number(cfg.credit_limit);
    }
    return null;
  }

  function isOpenCycleStatus(s) {
    return s === "open" || s === "in_review";
  }
  function isClosedGroupStatus(s) {
    return ["closed", "sent", "resent", "paid", "overdue"].indexOf(s) >= 0;
  }
  function cycleCanBeSent(cycle) {
    return ["closed", "sent", "resent", "paid", "overdue"].indexOf(cycle.status) >= 0;
  }
  function cycleCanBeCanceled(cycle) {
    return isOpenCycleStatus(cycle.status);
  }

  function openCycleForLink(linkId, data) {
    data = data || load();
    return data.cycles.filter(function (c) {
      return c.link_id === linkId && isOpenCycleStatus(c.status);
    })[0];
  }

  function addDaysToDate(dateStr, days) {
    var d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + (days || 0));
    return d.toISOString().slice(0, 10);
  }

  function referencePeriodForConfig(cfg) {
    var dueDays = (cfg && cfg.due_days_after_period > 0) ? cfg.due_days_after_period : 10;
    if (!cfg) return { start: "2026-05-01", end: "2026-05-31", due: addDaysToDate("2026-05-31", 10) };
    if (cfg.billing_period === "biweekly") { var e = "2026-05-31"; return { start: "2026-05-16", end: e, due: addDaysToDate(e, dueDays) }; }
    if (cfg.billing_period === "weekly")   { var e = "2026-06-01"; return { start: "2026-05-26", end: e, due: addDaysToDate(e, dueDays) }; }
    if (cfg.billing_period === "daily")    { var e = "2026-06-03"; return { start: "2026-06-03", end: e, due: addDaysToDate(e, dueDays) }; }
    if (cfg.billing_period === "custom") {
      var sd = String(cfg.period_start_day || 1).padStart(2, "0");
      var ed = String(cfg.period_end_day || 28).padStart(2, "0");
      var endDate = "2026-06-" + ed;
      return { start: "2026-05-" + sd, end: endDate, due: addDaysToDate(endDate, dueDays) };
    }
    var endDate = "2026-05-31";
    return { start: "2026-05-01", end: endDate, due: addDaysToDate(endDate, dueDays) };
  }

  function generateBillingCode(data, refStart) {
    var month = (refStart || "").slice(0, 7).replace("-", "") || new Date().toISOString().slice(0, 7).replace("-", "");
    var prefix = "FAT-" + month + "-";
    var maxSeq = 0;
    (data.cycles || []).forEach(function (c) {
      if (c.billing_code && c.billing_code.indexOf(prefix) === 0) {
        var n = parseInt(c.billing_code.slice(prefix.length), 10) || 0;
        if (n > maxSeq) maxSeq = n;
      }
    });
    return prefix + String(maxSeq + 1).padStart(3, "0");
  }

  function applyOverdueStatus(data) {
    var today = new Date().toISOString().slice(0, 10);
    (data.cycles || []).forEach(function (c) {
      if (["closed", "sent", "resent"].indexOf(c.status) >= 0 && c.due_date && c.due_date < today) {
        c.status = "overdue";
      }
    });
    return data;
  }

  function createCycleForLink(link, data) {
    var cfg = configById(link.configuration_id);
    var period = referencePeriodForConfig(cfg);
    return {
      id: uid("cyc"),
      billing_code: generateBillingCode(data || load(), period.start),
      configuration_id: link.configuration_id,
      link_id: link.id,
      customer_id: link.customer_id,
      company_id: link.company_id,
      fleet_id: link.fleet_id,
      reference_start: period.start,
      reference_end: period.end,
      due_date: period.due,
      status: "open",
      gross_amount: 0,
      discount_amount: 0,
      increase_amount: 0,
      net_amount: 0,
      invoice_count: 0,
      manual_adjustment_note: "",
      adjusted_by: null,
      adjusted_at: null,
      boleto_id: null,
      portal_link: "",
      sent_at: null,
      last_sent_at: null,
      closed_at: null,
      canceled_at: null
    };
  }

  function ensureOpenCycleForLink(data, link) {
    if (!linkIsActive(link, data)) return data;
    if (openCycleForLink(link.id, data)) return data;
    var cycle = createCycleForLink(link, data);
    data.cycles.push(cycle);
    data.history.push({
      id: uid("h"),
      cycle_id: cycle.id,
      action: "created",
      at: new Date().toISOString(),
      user: "Sistema",
      detail: "Faturamento gerado automaticamente para o vínculo " + link.id
    });
    return data;
  }

  function removeOpenCyclesForLink(data, linkId) {
    var removedIds = {};
    data.cycles = data.cycles.filter(function (c) {
      if (c.link_id === linkId && isOpenCycleStatus(c.status)) {
        removedIds[c.id] = true;
        return false;
      }
      return true;
    });
    data.cycle_items = data.cycle_items.filter(function (i) { return !removedIds[i.cycle_id]; });
    return data;
  }

  function syncOpenCycles(data) {
    data = data || load();
    var active = activeLinks(data);
    var activeLinkIds = {};
    active.forEach(function (link) {
      activeLinkIds[link.id] = true;
      ensureOpenCycleForLink(data, link);
    });
    var removedIds = {};
    data.cycles = data.cycles.filter(function (c) {
      if (c.link_id && isOpenCycleStatus(c.status) && !activeLinkIds[c.link_id]) {
        removedIds[c.id] = true;
        return false;
      }
      return true;
    });
    data.cycle_items = data.cycle_items.filter(function (i) { return !removedIds[i.cycle_id]; });
    return data;
  }

  function inactivateConfiguration(data, configId) {
    var cfg = data.configurations.filter(function (c) { return c.id === configId; })[0];
    if (!cfg) return data;
    cfg.status = "inactive";
    return syncOpenCycles(data);
  }

  function countDistinctCompanies(configId) {
    var ids = {};
    linksForConfig(configId).forEach(function (l) { ids[l.company_id] = true; });
    return Object.keys(ids).length;
  }
  function countDistinctFleets(configId) {
    var ids = {};
    linksForConfig(configId).forEach(function (l) { ids[l.fleet_id] = true; });
    return Object.keys(ids).length;
  }

  function itemsForCycle(cycleId) {
    return load().cycle_items.filter(function (i) { return i.cycle_id === cycleId; });
  }
  function activeItemsForCycle(cycleId, data) {
    data = data || load();
    return data.cycle_items.filter(function (i) { return i.cycle_id === cycleId && i.status === "active"; });
  }
  function logsForCycle(cycleId) {
    return load().send_logs.filter(function (l) { return l.cycle_id === cycleId; });
  }
  function historyForCycle(cycleId) {
    return load().history.filter(function (h) { return h.cycle_id === cycleId; });
  }
  function advancesForCycle(cycleId) {
    return load().cycle_advances.filter(function (a) { return a.cycle_id === cycleId; });
  }

  function recalculateNet(cycle) {
    if (!cycle) return cycle;
    cycle.net_amount = Math.max(
      0,
      Number(cycle.gross_amount || 0) - Number(cycle.discount_amount || 0) + Number(cycle.increase_amount || 0)
    );
    return cycle;
  }

  function recalculateCycleFromItems(data, cycleId) {
    var cycle = data.cycles.filter(function (c) { return c.id === cycleId; })[0];
    if (!cycle) return data;
    var items = activeItemsForCycle(cycleId, data);
    cycle.gross_amount = items.reduce(function (s, i) { return s + Number(i.gross_amount || 0); }, 0);
    cycle.invoice_count = items.length;
    recalculateNet(cycle);
    return data;
  }

  function formatMoney(v) {
    return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function formatDate(d) {
    if (!d) return "—";
    return d.split("-").reverse().join("/");
  }
  function formatDateRange(a, b) {
    return formatDate(a) + " - " + formatDate(b);
  }

  return {
    KEY: KEY,
    getData: getData,
    setData: setData,
    reset: reset,
    uid: uid,
    companyById: companyById,
    customerById: customerById,
    fleetById: fleetById,
    configById: configById,
    linksForConfig: linksForConfig,
    linkById: linkById,
    fleetsForCompany: fleetsForCompany,
    fleetBelongsToCompany: fleetBelongsToCompany,
    linkIsActive: linkIsActive,
    activeLinks: activeLinks,
    validateConfiguration: validateConfiguration,
    validateLink: validateLink,
    effectiveAdjustment: effectiveAdjustment,
    effectiveCreditLimit: effectiveCreditLimit,
    isOpenCycleStatus: isOpenCycleStatus,
    isClosedGroupStatus: isClosedGroupStatus,
    applyOverdueStatus: applyOverdueStatus,
    cycleCanBeSent: cycleCanBeSent,
    cycleCanBeCanceled: cycleCanBeCanceled,
    openCycleForLink: openCycleForLink,
    createCycleForLink: createCycleForLink,
    ensureOpenCycleForLink: ensureOpenCycleForLink,
    removeOpenCyclesForLink: removeOpenCyclesForLink,
    syncOpenCycles: syncOpenCycles,
    inactivateConfiguration: inactivateConfiguration,
    countDistinctCompanies: countDistinctCompanies,
    countDistinctFleets: countDistinctFleets,
    itemsForCycle: itemsForCycle,
    activeItemsForCycle: activeItemsForCycle,
    logsForCycle: logsForCycle,
    historyForCycle: historyForCycle,
    advancesForCycle: advancesForCycle,
    recalculateNet: recalculateNet,
    recalculateCycleFromItems: recalculateCycleFromItems,
    formatMoney: formatMoney,
    formatDate: formatDate,
    formatDateRange: formatDateRange,
    defaultData: defaultData
  };
})();
