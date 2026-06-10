var BillingStore = (function () {
  var KEY = "poc_billing_v2";

  function defaultData() {
    return {
      companies: [
        { id: "emp1", name: "Transportes Rápido Ltda", cnpj: "12.345.678/0001-90" },
        { id: "emp2", name: "Logística Sul S.A.", cnpj: "98.765.432/0001-10" },
        { id: "emp3", name: "Frota Comercial ME", cnpj: "11.222.333/0001-44" },
        { id: "emp4", name: "Operações Norte Ltda", cnpj: "55.666.777/0001-88" }
      ],
      customers: [
        { id: "cli1", name: "João Silva — Frota Caminhões", email: "financeiro@rapidotransportes.com.br" },
        { id: "cli2", name: "Maria Costa — Comercial", email: "contas@logisticasul.com.br" },
        { id: "cli3", name: "Carlos Mendes — Operacional", email: "faturamento@operacoesnorte.com.br" }
      ],
      fleets: [
        { id: "fr1", company_id: "emp1", name: "Frota Caminhões", cost_center: "Centro Frota Pesada" },
        { id: "fr2", company_id: "emp2", name: "Frota Comercial", cost_center: "Centro Vendas" },
        { id: "fr3", company_id: "emp3", name: "Frota Leve", cost_center: "Centro Administrativo" },
        { id: "fr4", company_id: "emp1", name: "Frota Terceirizados", cost_center: "Centro Externo" },
        { id: "fr5", company_id: "emp4", name: "Operacional", cost_center: "Centro Operacional" }
      ],
      configurations: [
        {
          id: "cfg1",
          name: "Mensal - Frota Caminhões",
          subtitle: "Faturamento mensal padrão",
          billing_type: "period",
          charge_type: "only_invoiced",
          billing_period: "monthly",
          adjustment_type: "increase",
          adjustment_mode: "percentage",
          adjustment_value: 2,
          credit_limit: null,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: ""
        },
        {
          id: "cfg2",
          name: "Quinzenal - Frota Comercial",
          subtitle: "Cobrança quinzenal",
          billing_type: "period",
          charge_type: "invoiced_and_immediate",
          billing_period: "biweekly",
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: null,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: ""
        },
        {
          id: "cfg3",
          name: "Pré-pago - Operacional",
          subtitle: "Limite de crédito controlado",
          billing_type: "prepaid",
          charge_type: "invoiced_and_immediate",
          billing_period: "monthly",
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: 15000,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: ""
        },
        {
          id: "cfg4",
          name: "Mensal - Frota Leve",
          subtitle: "Configuração inativa",
          billing_type: "period",
          charge_type: "only_invoiced",
          billing_period: "monthly",
          adjustment_type: "discount",
          adjustment_mode: "percentage",
          adjustment_value: 1.5,
          credit_limit: null,
          valid_from: "2025-01-01",
          valid_until: "2025-12-31",
          status: "inactive",
          notes: ""
        },
        {
          id: "cfg5",
          name: "Semanal - Frota Terceirizados",
          subtitle: "Fechamento semanal",
          billing_type: "period",
          charge_type: "only_invoiced",
          billing_period: "weekly",
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: null,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: ""
        },
        {
          id: "cfg6",
          name: "Imediata - Conveniência",
          subtitle: "Cobrança imediata",
          billing_type: "period",
          charge_type: "immediate",
          billing_period: "daily",
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: null,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "active",
          notes: ""
        },
        {
          id: "cfg7",
          name: "Pré-pago - Parceiros",
          subtitle: "Parceiros com limite",
          billing_type: "prepaid",
          charge_type: "invoiced_and_immediate",
          billing_period: "monthly",
          adjustment_type: "none",
          adjustment_mode: "percentage",
          adjustment_value: 0,
          credit_limit: 8000,
          valid_from: "2026-01-01",
          valid_until: "2026-12-31",
          status: "inactive",
          notes: ""
        }
      ],
      links: [
        { id: "lnk1", configuration_id: "cfg1", customer_id: "cli1", company_id: "emp1", fleet_id: "fr1", specific_adjustment_type: "none", specific_adjustment_value: 0, specific_credit_limit: null, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active" },
        { id: "lnk2", configuration_id: "cfg1", customer_id: "cli1", company_id: "emp1", fleet_id: "fr4", specific_adjustment_type: "increase", specific_adjustment_value: 1, specific_credit_limit: null, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active" },
        { id: "lnk3", configuration_id: "cfg1", customer_id: "cli2", company_id: "emp2", fleet_id: "fr2", specific_adjustment_type: "none", specific_adjustment_value: 0, specific_credit_limit: 20000, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active" },
        { id: "lnk4", configuration_id: "cfg1", customer_id: "cli3", company_id: "emp3", fleet_id: "fr3", specific_adjustment_type: "discount", specific_adjustment_value: 0.5, specific_credit_limit: null, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active" },
        { id: "lnk5", configuration_id: "cfg2", customer_id: "cli2", company_id: "emp2", fleet_id: "fr2", specific_adjustment_type: "none", specific_adjustment_value: 0, specific_credit_limit: null, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active" },
        { id: "lnk6", configuration_id: "cfg3", customer_id: "cli3", company_id: "emp4", fleet_id: "fr5", specific_adjustment_type: "none", specific_adjustment_value: 0, specific_credit_limit: 12000, valid_from: "2026-01-01", valid_until: "2026-12-31", status: "active" }
      ],
      cycles: [
        {
          id: "cyc1",
          configuration_id: "cfg1",
          link_id: "lnk1",
          customer_id: "cli1",
          company_id: "emp1",
          fleet_id: "fr1",
          reference_start: "2026-05-01",
          reference_end: "2026-05-31",
          due_date: "2026-06-10",
          status: "open",
          gross_amount: 48750.8,
          discount_amount: 0,
          increase_amount: 975.02,
          net_amount: 49725.82,
          invoice_count: 12,
          manual_adjustment_note: "",
          portal_link: "",
          sent_at: null,
          closed_at: null
        },
        {
          id: "cyc2",
          configuration_id: "cfg1",
          link_id: "lnk2",
          customer_id: "cli1",
          company_id: "emp1",
          fleet_id: "fr4",
          reference_start: "2026-05-01",
          reference_end: "2026-05-31",
          due_date: "2026-06-10",
          status: "open",
          gross_amount: 12340,
          discount_amount: 0,
          increase_amount: 123.4,
          net_amount: 12463.4,
          invoice_count: 4,
          manual_adjustment_note: "",
          portal_link: "",
          sent_at: null,
          closed_at: null
        },
        {
          id: "cyc3",
          configuration_id: "cfg1",
          link_id: "lnk3",
          customer_id: "cli2",
          company_id: "emp2",
          fleet_id: "fr2",
          reference_start: "2026-05-01",
          reference_end: "2026-05-31",
          due_date: "2026-06-10",
          status: "open",
          gross_amount: 31800,
          discount_amount: 0,
          increase_amount: 636,
          net_amount: 32436,
          invoice_count: 9,
          manual_adjustment_note: "",
          portal_link: "",
          sent_at: null,
          closed_at: null
        },
        {
          id: "cyc4",
          configuration_id: "cfg1",
          link_id: "lnk4",
          customer_id: "cli3",
          company_id: "emp3",
          fleet_id: "fr3",
          reference_start: "2026-05-01",
          reference_end: "2026-05-31",
          due_date: "2026-06-10",
          status: "open",
          gross_amount: 8920,
          discount_amount: 44.6,
          increase_amount: 0,
          net_amount: 8875.4,
          invoice_count: 3,
          manual_adjustment_note: "",
          portal_link: "",
          sent_at: null,
          closed_at: null
        },
        {
          id: "cyc5",
          configuration_id: "cfg2",
          link_id: "lnk5",
          customer_id: "cli2",
          company_id: "emp2",
          fleet_id: "fr2",
          reference_start: "2026-05-16",
          reference_end: "2026-05-31",
          due_date: "2026-06-05",
          status: "open",
          gross_amount: 22400,
          discount_amount: 336,
          increase_amount: 0,
          net_amount: 22064,
          invoice_count: 8,
          manual_adjustment_note: "",
          portal_link: "",
          sent_at: null,
          closed_at: null
        },
        {
          id: "cyc6",
          configuration_id: "cfg3",
          link_id: "lnk6",
          customer_id: "cli3",
          company_id: "emp4",
          fleet_id: "fr5",
          reference_start: "2026-05-01",
          reference_end: "2026-05-31",
          due_date: "2026-06-15",
          status: "open",
          gross_amount: 6420,
          discount_amount: 0,
          increase_amount: 0,
          net_amount: 6420,
          invoice_count: 2,
          manual_adjustment_note: "",
          portal_link: "",
          sent_at: null,
          closed_at: null
        },
        {
          id: "cyc7",
          configuration_id: "cfg1",
          link_id: "lnk1",
          customer_id: "cli1",
          company_id: "emp1",
          fleet_id: "fr1",
          reference_start: "2026-04-01",
          reference_end: "2026-04-30",
          due_date: "2026-05-10",
          status: "sent",
          gross_amount: 51200,
          discount_amount: 0,
          increase_amount: 1024,
          net_amount: 52224,
          invoice_count: 14,
          manual_adjustment_note: "",
          portal_link: "https://portal.demo.ecomercial/cliente/rapidotransportes/fat-2026-04",
          sent_at: "2026-05-08T14:32:00",
          closed_at: "2026-05-07T16:15:00"
        },
        {
          id: "cyc8",
          configuration_id: "cfg3",
          link_id: "lnk6",
          customer_id: "cli3",
          company_id: "emp4",
          fleet_id: "fr5",
          reference_start: "2026-04-01",
          reference_end: "2026-04-30",
          due_date: "2026-05-15",
          status: "closed",
          gross_amount: 9850,
          discount_amount: 0,
          increase_amount: 0,
          net_amount: 9850,
          invoice_count: 5,
          manual_adjustment_note: "",
          portal_link: "https://portal.demo.ecomercial/cliente/operacoes/fat-2026-04",
          sent_at: null,
          closed_at: "2026-05-02T10:00:00"
        }
      ],
      cycle_items: [
        { id: "ci1", cycle_id: "cyc1", nfe_number: "00012458", nfe_series: "1", nfe_key: "35260512451234567890123456789012345678901234", issue_date: "2026-05-05", gross_amount: 4200, net_amount: 4284, plate: "ABC-1D23", product: "Diesel S10" },
        { id: "ci2", cycle_id: "cyc1", nfe_number: "00012459", nfe_series: "1", nfe_key: "35260512451234567890123456789012345678901235", issue_date: "2026-05-12", gross_amount: 3850.5, net_amount: 3927.51, plate: "DEF-4G56", product: "Diesel S10" },
        { id: "ci3", cycle_id: "cyc1", nfe_number: "00012460", nfe_series: "1", nfe_key: "35260512451234567890123456789012345678901236", issue_date: "2026-05-20", gross_amount: 5100, net_amount: 5202, plate: "GHI-7J89", product: "Gasolina Comum" },
        { id: "ci4", cycle_id: "cyc7", nfe_number: "00012301", nfe_series: "1", nfe_key: "35260412301234567890123456789012345678901201", issue_date: "2026-04-08", gross_amount: 3800, net_amount: 3876, plate: "ABC-1D23", product: "Diesel S10" },
        { id: "ci5", cycle_id: "cyc7", nfe_number: "00012302", nfe_series: "1", nfe_key: "35260412301234567890123456789012345678901202", issue_date: "2026-04-15", gross_amount: 4200, net_amount: 4284, plate: "JKL-0M12", product: "Diesel S10" }
      ],
      send_logs: [
        { id: "sl1", cycle_id: "cyc7", email_to: "financeiro@rapidotransportes.com.br", sent_at: "2026-05-08T14:32:00", status: "success", sent_by: "Admin" }
      ],
      history: [
        { id: "h1", cycle_id: "cyc1", action: "created", at: "2026-06-01T08:00:00", user: "Sistema", detail: "Faturamento gerado automaticamente para o vínculo lnk1" },
        { id: "h2", cycle_id: "cyc7", action: "closed", at: "2026-05-07T16:15:00", user: "Admin", detail: "Faturamento fechado — 14 notas" },
        { id: "h3", cycle_id: "cyc7", action: "sent", at: "2026-05-08T14:32:00", user: "Admin", detail: "E-mail enviado com link do portal" }
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
    return !!(cfg && cfg.status === "active");
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
        l.id !== excludeId;
    })[0];
  }
  function validateLink(link, excludeId) {
    if (!fleetBelongsToCompany(link.fleet_id, link.company_id)) {
      return "A frota selecionada não pertence à empresa.";
    }
    if (findDuplicateLink(link.configuration_id, link.customer_id, link.company_id, link.fleet_id, excludeId)) {
      return "Já existe vínculo com este cliente, empresa e frota nesta configuração.";
    }
    return null;
  }
  function isOpenCycleStatus(s) {
    return s === "open" || s === "in_review";
  }
  function openCycleForLink(linkId, data) {
    data = data || load();
    return data.cycles.filter(function (c) {
      return c.link_id === linkId && isOpenCycleStatus(c.status);
    })[0];
  }
  function referencePeriodForConfig(cfg) {
    if (!cfg) return { start: "2026-05-01", end: "2026-05-31", due: "2026-06-10" };
    if (cfg.billing_period === "biweekly") {
      return { start: "2026-05-16", end: "2026-05-31", due: "2026-06-05" };
    }
    if (cfg.billing_period === "weekly") {
      return { start: "2026-05-26", end: "2026-06-01", due: "2026-06-08" };
    }
    if (cfg.billing_period === "daily") {
      return { start: "2026-06-03", end: "2026-06-03", due: "2026-06-04" };
    }
    return { start: "2026-05-01", end: "2026-05-31", due: "2026-06-10" };
  }
  function createCycleForLink(link) {
    var cfg = configById(link.configuration_id);
    var period = referencePeriodForConfig(cfg);
    return {
      id: uid("cyc"),
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
      portal_link: "",
      sent_at: null,
      closed_at: null
    };
  }
  function ensureOpenCycleForLink(data, link) {
    if (!linkIsActive(link, data)) return data;
    if (openCycleForLink(link.id, data)) return data;
    var cycle = createCycleForLink(link);
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
  function logsForCycle(cycleId) {
    return load().send_logs.filter(function (l) { return l.cycle_id === cycleId; });
  }
  function historyForCycle(cycleId) {
    return load().history.filter(function (h) { return h.cycle_id === cycleId; });
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
    var items = data.cycle_items.filter(function (i) { return i.cycle_id === cycleId; });
    cycle.gross_amount = items.reduce(function (s, i) { return s + Number(i.gross_amount || 0); }, 0);
    cycle.invoice_count = items.length;
    recalculateNet(cycle);
    return data;
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
    validateLink: validateLink,
    isOpenCycleStatus: isOpenCycleStatus,
    openCycleForLink: openCycleForLink,
    createCycleForLink: createCycleForLink,
    ensureOpenCycleForLink: ensureOpenCycleForLink,
    removeOpenCyclesForLink: removeOpenCyclesForLink,
    syncOpenCycles: syncOpenCycles,
    countDistinctCompanies: countDistinctCompanies,
    countDistinctFleets: countDistinctFleets,
    itemsForCycle: itemsForCycle,
    logsForCycle: logsForCycle,
    historyForCycle: historyForCycle,
    formatMoney: formatMoney,
    formatDate: formatDate,
    formatDateRange: formatDateRange,
    recalculateNet: recalculateNet,
    recalculateCycleFromItems: recalculateCycleFromItems,
    defaultData: defaultData
  };
})();
