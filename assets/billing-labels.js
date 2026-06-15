var BillingLabels = {
  chargeType: function (v) {
    var m = {
      only_invoiced_sales: "Apenas vendas faturadas",
      invoiced_and_immediate: "Faturadas + Imediata",
      immediate: "Imediata"
    };
    return m[v] || v;
  },
  billingPeriod: function (v, cfg) {
    var m = { monthly: "Mensal", biweekly: "Quinzenal", weekly: "Semanal", daily: "Diário", custom: "Personalizado" };
    var t = m[v] || v;
    if (v === "custom" && cfg && cfg.period_start_day && cfg.period_end_day) {
      t += " (dia " + cfg.period_start_day + " a " + cfg.period_end_day + ")";
    }
    return t;
  },
  adjustment: function (type, mode, value) {
    if (!type || type === "none" || !Number(value)) return '<span class="text-muted">—</span>';
    var sign = type === "increase" ? "+" : "−";
    var arrow = type === "increase" ? '<i class="fa fa-arrow-up"></i> ' : '<i class="fa fa-arrow-down"></i> ';
    var val = mode === "fixed_amount"
      ? sign + " " + BillingStore.formatMoney(value)
      : sign + " " + Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + "%";
    var cls = type === "increase" ? "bill-adj-up" : "bill-adj-down";
    return '<span class="' + cls + '">' + arrow + val + "</span>";
  },
  creditLimit: function (v) {
    if (v === null || v === undefined || v === "") return '<span class="text-muted">Sem limite</span>';
    return BillingStore.formatMoney(v);
  },
  cycleStatus: function (v) {
    var m = {
      open: { t: "Em aberto", cls: "info" },
      in_review: { t: "Em conferência", cls: "warning" },
      closed: { t: "Fechado — Aguardando pagamento", cls: "default" },
      sent: { t: "Enviado — Aguardando pagamento", cls: "primary" },
      resent: { t: "Reenviado — Aguardando pagamento", cls: "primary" },
      paid: { t: "Pago / Finalizado", cls: "success" },
      overdue: { t: "Vencido — Pagamento atrasado", cls: "danger" }
    };
    var x = m[v] || { t: v, cls: "default" };
    return '<span class="label label-' + x.cls + '">' + x.t + "</span>";
  },
  historyAction: function (a) {
    var m = {
      created: "Criação do faturamento",
      item_added: "Nota adicionada",
      item_removed: "Nota removida",
      adjustment: "Ajuste manual aplicado",
      recalculated: "Valores recalculados",
      closed: "Fechamento",
      sent: "Envio de fatura",
      resent: "Reenvio de fatura",
      paid: "Marcado como Pago / Finalizado",
      advance: "Adiantamento registrado"
    };
    return m[a] || a;
  }
};
