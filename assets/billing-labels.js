var BillingLabels = {
  billingType: function (v) {
    var m = { period: { t: "Período", cls: "primary" }, prepaid: { t: "Pré-pago", cls: "warning" } };
    var x = m[v] || { t: v, cls: "default" };
    return '<span class="label label-' + x.cls + '">' + x.t + "</span>";
  },
  chargeType: function (v) {
    var m = {
      only_invoiced: "Apenas vendas faturadas",
      invoiced_and_immediate: "Faturadas + Imediata",
      immediate: "Imediata"
    };
    return m[v] || v;
  },
  billingPeriod: function (v) {
    var m = { monthly: "Mensal", biweekly: "Quinzenal", weekly: "Semanal", daily: "Diário", custom: "Personalizado" };
    return m[v] || v;
  },
  adjustment: function (type, mode, value) {
    if (!type || type === "none" || !value) return "—";
    var sign = type === "increase" ? "+" : "−";
    var arrow = type === "increase" ? '<i class="fa fa-arrow-up"></i> ' : '<i class="fa fa-arrow-down"></i> ';
    var val = mode === "fixed_amount"
      ? BillingStore.formatMoney(value)
      : sign + " " + Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + "%";
    var cls = type === "increase" ? "bill-adj-up" : "bill-adj-down";
    return '<span class="' + cls + '">' + arrow + val + "</span>";
  },
  creditLimit: function (v) {
    if (v === null || v === undefined || v === "") return '<span class="text-muted">Não aplicável</span>';
    return BillingStore.formatMoney(v);
  },
  cycleStatus: function (v) {
    var m = {
      open: { t: "Em aberto", cls: "info" },
      in_review: { t: "Em conferência", cls: "warning" },
      closed: { t: "Fechado", cls: "default" },
      sent: { t: "Enviado", cls: "success" },
      resent: { t: "Reenviado", cls: "primary" },
      paid: { t: "Pago", cls: "success" },
      overdue: { t: "Vencido", cls: "danger" },
      canceled: { t: "Cancelado", cls: "default" }
    };
    var x = m[v] || { t: v, cls: "default" };
    return '<span class="label label-' + x.cls + '">' + x.t + "</span>";
  }
};
