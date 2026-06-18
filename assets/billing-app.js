var BillingUI = (function () {
  function toast(msg, type) {
    var el = document.getElementById("poc-toast");
    if (!el) return;
    var cls = type === "error" ? "alert-danger" : type === "warn" ? "alert-warning" : "alert-success";
    el.innerHTML = '<div class="alert ' + cls + ' alert-dismissible"><button type="button" class="close" data-dismiss="alert">&times;</button>' + msg + "</div>";
    setTimeout(function () { el.innerHTML = ""; }, 4500);
  }

  function esc(s) {
    if (s === undefined || s === null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function openModal(title, bodyHtml, onSave, options) {
    options = options || {};
    var container = document.querySelector(".poc_modal");
    if (!container) return;
    var dialogCls = "modal-dialog" + (options.size === "lg" ? " modal-lg" : "") + (options.size === "xl" ? " modal-lg bill-modal-xl" : "");
    var saveLabel = options.saveLabel || "Salvar";
    container.innerHTML =
      '<div class="' + dialogCls + '" role="document"><div class="modal-content">' +
      '<div class="modal-header"><button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>' +
      '<h4 class="modal-title">' + title + "</h4></div>" +
      '<div class="modal-body">' + bodyHtml + "</div>" +
      '<div class="modal-footer">' +
      (options.extraFooter || "") +
      (options.hideSave ? "" : '<button type="button" class="tw-dw-btn tw-dw-btn-primary tw-text-white bill-modal-save">' + saveLabel + "</button>") +
      '<button type="button" class="tw-dw-btn tw-dw-btn-neutral tw-text-white" data-dismiss="modal">Fechar</button>' +
      "</div></div></div>";
    var saveBtn = container.querySelector(".bill-modal-save");
    if (saveBtn && onSave) {
      saveBtn.onclick = function () {
        if (onSave() !== false) jQuery(container).modal("hide");
      };
    }
    jQuery(container).modal("show");
  }

  function statusLabel(active) {
    return active === "active"
      ? '<span class="label label-success">Ativo</span>'
      : '<span class="label label-default">Inativo</span>';
  }

  function formatDateTime(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function bindSearch(searchId, tbodyId) {
    var input = document.getElementById(searchId);
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.toLowerCase();
      document.querySelectorAll("#" + tbodyId + " tr.bill-main-row").forEach(function (tr) {
        var show = tr.textContent.toLowerCase().indexOf(q) >= 0;
        tr.style.display = show ? "" : "none";
        var next = tr.nextElementSibling;
        if (next && next.classList.contains("bill-expand-row") && !show) next.style.display = "none";
      });
    });
  }

  function sel(current, value) {
    return current === value ? " selected" : "";
  }

  return { toast: toast, esc: esc, openModal: openModal, statusLabel: statusLabel, formatDateTime: formatDateTime, bindSearch: bindSearch, sel: sel };
})();

var BillingPages = {
  inicio: function () {
    function render() {
      var d = BillingStore.syncOpenCycles(BillingStore.getData());
      BillingStore.setData(d);
      var rows = [];
      var actLinks = BillingStore.activeLinks(d);
      var openCycles = d.cycles.filter(function (c) { return BillingStore.isOpenCycleStatus(c.status); });
      rows.push(
        '<tr><td><span class="label label-default">Regra</span></td>' +
        "<td><strong>Vínculos ativos × Faturamentos em aberto</strong></td>" +
        "<td>1 faturamento por vínculo no período de referência</td>" +
        "<td>" + actLinks.length + " / " + openCycles.length + "</td>" +
        "<td>" + (actLinks.length === openCycles.length ? '<span class="label label-success">Consistente</span>' : '<span class="label label-warning">Divergente</span>') + "</td></tr>"
      );
      d.configurations.forEach(function (c) {
        if (c.deleted_at) return;
        var links = BillingStore.linksForConfig(c.id).filter(function (l) { return BillingStore.linkIsActive(l, d); });
        rows.push(
          '<tr><td><span class="label label-primary">Configuração</span></td>' +
          "<td>" + BillingUI.esc(c.name) + "</td>" +
          "<td>" + BillingLabels.chargeType(c.charge_type) + " · " + BillingLabels.billingPeriod(c.billing_period, c) + "</td>" +
          "<td>" + links.length + " vínculo(s) ativo(s)</td>" +
          "<td>" + BillingUI.statusLabel(c.status) + "</td></tr>"
        );
      });
      openCycles.forEach(function (cy) {
        var comp = BillingStore.companyById(cy.company_id);
        var fleet = BillingStore.fleetById(cy.fleet_id);
        rows.push(
          '<tr><td><span class="label label-info">Em aberto</span></td>' +
          "<td>" + (comp ? BillingUI.esc(comp.name) : "—") + "</td>" +
          "<td>" + (fleet ? BillingUI.esc(fleet.name) : "—") + " · " + BillingStore.formatDateRange(cy.reference_start, cy.reference_end) + "</td>" +
          "<td>" + cy.invoice_count + " NF-e</td>" +
          "<td>" + BillingStore.formatMoney(cy.net_amount) + "</td></tr>"
        );
      });
      var tbody = document.getElementById("overview-tbody");
      if (tbody) tbody.innerHTML = rows.join("");
    }
    var btn = document.getElementById("btn-reset-demo");
    if (btn) {
      btn.onclick = function () {
        if (confirm("Restaurar dados de demonstração?")) {
          BillingStore.reset();
          render();
          BillingUI.toast("Dados restaurados.", "success");
        }
      };
    }
    render();
  },

  configuracao: function () {
    var expanded = { cfg1: true };
    var d0 = BillingStore.syncOpenCycles(BillingStore.getData());
    BillingStore.setData(d0);

    var TODAY = "2026-06-12";

    function expandBtnHtml(configId, isOpen) {
      return (
        '<td class="bill-col-expand"><button type="button" class="bill-expand-btn' + (isOpen ? " is-open" : "") + '" data-id="' + configId + '" title="Expandir vínculos" aria-expanded="' + (isOpen ? "true" : "false") + '">' +
        '<svg class="bill-expand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6"/></svg>' +
        "</button></td>"
      );
    }

    function addLinkBtn(configId, label) {
      label = label || "Adicionar vínculo";
      return '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-bg-gradient-to-r tw-from-indigo-600 tw-to-blue-500 tw-font-bold tw-text-white tw-border-none tw-rounded-full btn-add-link" data-config-id="' + configId + '"><i class="fa fa-plus"></i> ' + label + "</button>";
    }

    function renderExpandRow(cfg) {
      var links = BillingStore.linksForConfig(cfg.id);
      var head =
        '<div class="bill-expand-head">' +
        '<h5 class="bill-expand-title"><i class="fa fa-building-o"></i> Empresas e Frotas vinculadas (' + links.length + ")</h5>" +
        addLinkBtn(cfg.id) +
        "</div>";
      if (!links.length) {
        return head + '<div class="bill-expand-empty">Nenhum vínculo cadastrado.<br>' + addLinkBtn(cfg.id, "Adicionar primeiro vínculo") + "</div>";
      }
      var rows = links.map(function (l) {
        var comp = BillingStore.companyById(l.company_id);
        var fleet = BillingStore.fleetById(l.fleet_id);
        var isRemoved = l.status !== "active";
        var rowStyle = isRemoved ? ' style="opacity:.5"' : "";
        var removedBadge = isRemoved ? ' <span class="label label-default">Removido</span>' : "";
        var lkRules = l.discount_rules || [];
        var adjTxt = BillingLabels.adjustment(l.specific_adjustment_type, l.specific_adjustment_mode, l.specific_adjustment_value);
        var discountCell = adjTxt !== "—"
          ? '<small>' + adjTxt + '</small>'
          : "";
        if (lkRules.length) {
          discountCell += (discountCell ? "<br>" : "") +
            '<span class="label label-success"><i class="fa fa-tag"></i> ' + lkRules.length + ' regra' + (lkRules.length > 1 ? "s" : "") + ' por produto</span>';
        }
        if (!discountCell) discountCell = '<span class="text-muted">—</span>';
        return (
          "<tr" + rowStyle + ">" +
          "<td>" + (comp ? BillingUI.esc(comp.name) : "—") + removedBadge + "</td>" +
          "<td style='font-size:12px'>" + (comp ? comp.cnpj : "—") + "</td>" +
          "<td>" + (fleet ? BillingUI.esc(fleet.name) : "—") + "</td>" +
          "<td>" + BillingLabels.creditLimit(l.specific_credit_limit) + "</td>" +
          "<td>" + discountCell + "</td>" +
          "<td>" + BillingStore.formatDateRange(l.valid_from, l.valid_until) + "</td>" +
          '<td class="bill-col-actions">' +
          (!isRemoved
            ? '<button type="button" class="btn btn-default btn-xs btn-edit-link" data-id="' + l.id + '"><i class="fa fa-pencil"></i> Editar</button> ' +
              '<button type="button" class="btn btn-danger btn-xs btn-remove-link" data-id="' + l.id + '"><i class="fa fa-times"></i> Remover</button>'
            : '<span class="text-muted" style="font-size:11px"><i class="fa fa-clock-o"></i> Aguardando fechamento do último faturamento</span>') +
          "</td></tr>"
        );
      }).join("");
      return (
        head +
        '<div class="table-responsive"><table class="table table-bordered bill-subtable">' +
        "<thead><tr><th>Empresa</th><th>CNPJ</th><th>Frota</th><th>Limite</th><th>Descontos</th><th>Vigência</th><th>Ações</th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table></div>"
      );
    }

    function configPassesFilters(c) {
      var v = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
      var links = BillingStore.linksForConfig(c.id);
      if (v("flt-period") && c.billing_period !== v("flt-period")) return false;
      if (v("flt-status") && c.status !== v("flt-status")) return false;
      if (v("flt-company") && !links.some(function (l) { return l.company_id === v("flt-company"); })) return false;
      if (v("flt-fleet") && !links.some(function (l) { return l.fleet_id === v("flt-fleet"); })) return false;
      var vig = v("flt-validity");
      if (vig === "current" && !(c.valid_from <= TODAY && c.valid_until >= TODAY)) return false;
      if (vig === "expired" && !(c.valid_until < TODAY)) return false;
      if (vig === "future" && !(c.valid_from > TODAY)) return false;
      return true;
    }

    function render() {
      var d = BillingStore.getData();
      var tbody = document.getElementById("tbody-configs");
      if (!tbody) return;
      var visible = d.configurations.filter(function (c) { return !c.deleted_at; });
      var filtered = visible.filter(configPassesFilters);
      var rows = [];
      filtered.forEach(function (c) {
        var isOpen = !!expanded[c.id];
        rows.push(
          '<tr class="bill-main-row' + (isOpen ? " is-expanded" : "") + '" data-id="' + c.id + '">' +
          expandBtnHtml(c.id, isOpen) +
          "<td><strong>" + BillingUI.esc(c.name) + "</strong>" + (c.subtitle ? '<br><small class="text-muted">' + BillingUI.esc(c.subtitle) + "</small>" : "") + "</td>" +
          "<td>" + BillingLabels.chargeType(c.charge_type) + "</td>" +
          "<td>" + BillingLabels.billingPeriod(c.billing_period, c) + "</td>" +
          "<td>" + (function () {
            var rules = c.discount_rules || [];
            if (!rules.length) return '<span class="text-muted">—</span>';
            return '<span class="label label-default"><i class="fa fa-tag"></i> ' + rules.length + ' desconto' + (rules.length > 1 ? "s" : "") + '</span>';
          })() + "</td>" +
          "<td>" + BillingLabels.creditLimit(c.credit_limit) + "</td>" +
          "<td>" + (function () {
            var days = c.due_days_after_period || 10;
            var block = c.block_on_overdue;
            return '<span title="Vencimento: ' + days + ' dias após fechamento">' + days + ' dias</span>' +
              (block ? ' <span class="label label-danger" title="Bloqueia PDV em caso de inadimplência"><i class="fa fa-ban"></i> PDV</span>' : '');
          })() + "</td>" +
          "<td>" + BillingStore.formatDateRange(c.valid_from, c.valid_until) + "</td>" +
          "<td>" + BillingStore.countDistinctCompanies(c.id) + "</td>" +
          "<td>" + BillingStore.countDistinctFleets(c.id) + "</td>" +
          "<td>" + BillingUI.statusLabel(c.status) + "</td>" +
          '<td class="bill-col-menu">' +
          '<div class="btn-group">' +
          '<button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Ações <span class="caret"></span></button>' +
          '<ul class="dropdown-menu dropdown-menu-right">' +
          '<li><a href="#" class="btn-edit-cfg" data-id="' + c.id + '"><i class="fa fa-pencil"></i> Editar modelo</a></li>' +
          '<li><a href="#" class="btn-add-link-cfg" data-id="' + c.id + '"><i class="fa fa-plus"></i> Adicionar vínculo</a></li>' +
          '<li class="divider"></li>' +
          '<li><a href="#" class="btn-toggle-cfg ' + (c.status === "active" ? "text-warning" : "text-success") + '" data-id="' + c.id + '">' +
          '<i class="fa ' + (c.status === "active" ? "fa-ban" : "fa-check") + '"></i> ' + (c.status === "active" ? "Inativar modelo" : "Ativar modelo") + '</a></li>' +
          '</ul></div>' +
          "</td></tr>"
        );
        if (isOpen) {
          rows.push('<tr class="bill-expand-row" data-detail-for="' + c.id + '"><td colspan="11"><div class="bill-expand-panel">' + renderExpandRow(c) + "</div></td></tr>");
        }
      });
      tbody.innerHTML = rows.length ? rows.join("") : '<tr><td colspan="11" class="text-center text-muted" style="padding:24px">Nenhuma configuração encontrada com os filtros aplicados.</td></tr>';
      var info = document.getElementById("config-count-info");
      if (info) {
        info.textContent = filtered.length === visible.length
          ? "Mostrando " + visible.length + " registro(s)"
          : "Mostrando " + filtered.length + " de " + visible.length + " registro(s) (filtros aplicados)";
      }
    }

    function toggleExpandRow(configId) {
      var tbody = document.getElementById("tbody-configs");
      var mainRow = tbody.querySelector('tr.bill-main-row[data-id="' + configId + '"]');
      if (!mainRow) { render(); return; }
      var btn = mainRow.querySelector(".bill-expand-btn");
      var detailRow = tbody.querySelector('tr.bill-expand-row[data-detail-for="' + configId + '"]');
      if (expanded[configId]) {
        delete expanded[configId];
        mainRow.classList.remove("is-expanded");
        if (btn) { btn.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
        if (detailRow) detailRow.remove();
      } else {
        expanded[configId] = true;
        mainRow.classList.add("is-expanded");
        if (btn) { btn.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); }
        var cfg = BillingStore.configById(configId);
        var tr = document.createElement("tr");
        tr.className = "bill-expand-row";
        tr.setAttribute("data-detail-for", configId);
        tr.innerHTML = '<td colspan="11"><div class="bill-expand-panel">' + renderExpandRow(cfg) + "</div></td>";
        mainRow.parentNode.insertBefore(tr, mainRow.nextSibling);
      }
    }

    function discountRuleLabel(r) {
      var target = r.target_type === "product" ? "Produto: <strong>" + BillingUI.esc(r.target_name) + "</strong>"
        : r.target_type === "category" ? "Categoria: <strong>" + BillingUI.esc(r.target_name) + "</strong>"
        : "Todos os produtos";
      var val = r.discount_type === "fixed_per_unit"
        ? "R$ " + Number(r.discount_value).toFixed(3) + "/" + (r.discount_unit || "un")
        : Number(r.discount_value).toFixed(2) + "% de desconto";
      return target + " — <span class='bill-adj-down'>− " + val + "</span> (prioridade " + r.priority + ")";
    }

    function discountRulesTableHtml(rules, btnClass) {
      rules = rules || [];
      btnClass = btnClass || "btn-remove-discount-rule";
      if (!rules.length) {
        return '<p class="text-muted" style="margin:6px 0">Nenhuma regra de desconto por produto cadastrada.</p>';
      }
      var rows = rules.map(function (r, idx) {
        return "<tr><td>" + discountRuleLabel(r) + "</td>" +
          '<td><button type="button" class="btn btn-danger btn-xs ' + btnClass + '" data-idx="' + idx + '"><i class="fa fa-times"></i></button></td></tr>';
      }).join("");
      return '<table class="table table-condensed" style="margin:0"><tbody>' + rows + "</tbody></table>";
    }

    function configFormHtml(c) {
      c = c || {};
      var s = BillingUI.sel;
      var isCustom = c.billing_period === "custom";
      var rules = c.discount_rules || [];
      var rulesJson = JSON.stringify(rules).replace(/"/g, "&quot;");
      return (
        '<div class="row">' +
        '<div class="col-md-6"><div class="form-group"><label>Nome do modelo *</label><input type="text" class="form-control" id="cf_name" value="' + BillingUI.esc(c.name || "") + '"></div></div>' +
        '<div class="col-md-6"><div class="form-group"><label>Tipo de cobrança *</label><select class="form-control" id="cf_charge">' +
        '<option value="only_invoiced_sales"' + s(c.charge_type, "only_invoiced_sales") + ">Apenas vendas faturadas</option>" +
        '<option value="invoiced_and_immediate"' + s(c.charge_type, "invoiced_and_immediate") + ">Faturadas + Imediata</option>" +
        "</select></div></div>" +
        '<div class="col-md-4"><div class="form-group"><label>Período de cobrança *</label><select class="form-control" id="cf_period">' +
        '<option value="monthly"' + s(c.billing_period, "monthly") + ">Mensal</option>" +
        '<option value="biweekly"' + s(c.billing_period, "biweekly") + ">Quinzenal</option>" +
        '<option value="weekly"' + s(c.billing_period, "weekly") + ">Semanal</option>" +
        '<option value="daily"' + s(c.billing_period, "daily") + ">Diário</option>" +
        '<option value="custom"' + s(c.billing_period, "custom") + ">Personalizado</option>" +
        "</select></div></div>" +
        '<div class="col-md-4" id="cf_startday_wrap" style="display:' + (isCustom ? "block" : "none") + '"><div class="form-group"><label>Dia inicial</label><input type="number" min="1" max="31" class="form-control" id="cf_startday" value="' + (c.period_start_day || "") + '"></div></div>' +
        '<div class="col-md-4" id="cf_endday_wrap" style="display:' + (isCustom ? "block" : "none") + '"><div class="form-group"><label>Dia final</label><input type="number" min="1" max="31" class="form-control" id="cf_endday" value="' + (c.period_end_day || "") + '"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Limite de crédito (R$)</label><input type="number" min="0" step="0.01" class="form-control" id="cf_limit" value="' + (c.credit_limit === null || c.credit_limit === undefined ? "" : c.credit_limit) + '" placeholder="Sem limite"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Vigência inicial *</label><input type="date" class="form-control" id="cf_from" value="' + (c.valid_from || "") + '"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Vigência final *</label><input type="date" class="form-control" id="cf_to" value="' + (c.valid_until || "") + '"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Status *</label><select class="form-control" id="cf_status">' +
        '<option value="active"' + s(c.status, "active") + ">Ativo</option>" +
        '<option value="inactive"' + s(c.status, "inactive") + ">Inativo</option>" +
        "</select></div></div>" +
        '<div class="col-md-12"><div class="form-group"><label>Observações</label><textarea class="form-control" id="cf_notes" rows="2">' + BillingUI.esc(c.notes || "") + "</textarea></div></div>" +
        "</div>" +
        '<hr style="margin:10px 0"><h5 style="margin-bottom:10px"><i class="fa fa-calendar-check-o"></i> Cobrança e inadimplência</h5>' +
        '<div class="row">' +
        '<div class="col-md-4"><div class="form-group"><label>Vencimento da fatura <span class="text-danger">*</span> <small class="text-muted">(dias após o fechamento)</small></label>' +
        '<div class="input-group"><input type="number" min="1" max="365" class="form-control" id="cf_due_days" value="' + (c.due_days_after_period || 10) + '" placeholder="Ex: 10"><span class="input-group-addon">dias</span></div>' +
        '<p class="help-block" style="margin:4px 0 0;font-size:11px">Ex.: 10 dias → fatura com vencimento em 10 dias após o fechamento do período.</p>' +
        "</div></div>" +
        '<div class="col-md-8"><div class="form-group"><label>Bloqueio no PDV por inadimplência</label>' +
        '<div class="poc-toggle-wrap" style="margin-top:6px">' +
        '<label class="poc-toggle-label" style="display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:normal">' +
        '<input type="checkbox" id="cf_block_overdue" style="width:18px;height:18px;cursor:pointer"' + (c.block_on_overdue ? " checked" : "") + '>' +
        '<span>Bloquear vendas faturadas no PDV quando o cliente estiver com fatura <strong>Vencida</strong></span>' +
        '</label>' +
        '</div>' +
        '<p class="help-block" style="margin:4px 0 0;font-size:11px"><i class="fa fa-info-circle"></i> Quando ativado, o PDV impedirá novas vendas faturadas para essa frota enquanto houver fatura em atraso.</p>' +
        "</div></div>" +
        "</div>" +
        '<hr style="margin:10px 0"><h5 style="margin-bottom:10px"><i class="fa fa-tag"></i> Descontos por produto / preço especial</h5>' +
        '<div class="alert alert-info poc-alert-compact"><i class="fa fa-info-circle"></i> Defina descontos por produto ou categoria, como R$ 0,02/L no Diesel S10. Equivale às regras de <strong>Vendas → Descontos</strong> e é aplicado no cálculo do faturamento.</div>' +
        '<input type="hidden" id="cf_discount_rules" value="' + rulesJson + '">' +
        '<div id="cf_discount_rules_table">' + discountRulesTableHtml(rules) + "</div>" +
        '<div class="row" style="margin-top:10px;background:#f8fafc;padding:10px;border-radius:6px;border:1px solid #e2e8f0">' +
        '<div class="col-md-3"><div class="form-group" style="margin:0"><label style="font-size:12px">Alvo</label><select class="form-control input-sm" id="nr_target_type"><option value="product">Produto específico</option><option value="category">Categoria</option><option value="all">Todos os produtos</option></select></div></div>' +
        '<div class="col-md-3"><div class="form-group" style="margin:0"><label style="font-size:12px">Nome do produto/categoria</label><input type="text" class="form-control input-sm" id="nr_target_name" placeholder="ex: Diesel S10"></div></div>' +
        '<div class="col-md-2"><div class="form-group" style="margin:0"><label style="font-size:12px">Tipo</label><select class="form-control input-sm" id="nr_dtype"><option value="fixed_per_unit">Fixo por unidade (R$/L)</option><option value="percentage">Percentual (%)</option></select></div></div>' +
        '<div class="col-md-2"><div class="form-group" style="margin:0"><label style="font-size:12px">Valor</label><input type="number" min="0" step="0.001" class="form-control input-sm" id="nr_dval" placeholder="0.02"></div></div>' +
        '<div class="col-md-2" style="padding-top:20px"><button type="button" class="btn btn-primary btn-sm btn-add-discount-rule" style="width:100%"><i class="fa fa-plus"></i> Adicionar</button></div>' +
        "</div>"
      );
    }

    function bindConfigFormBehavior() {
      var period = document.getElementById("cf_period");
      function refresh() {
        var isCustom = period && period.value === "custom";
        var sw = document.getElementById("cf_startday_wrap");
        var ew = document.getElementById("cf_endday_wrap");
        if (sw) sw.style.display = isCustom ? "block" : "none";
        if (ew) ew.style.display = isCustom ? "block" : "none";
      }
      if (period) period.onchange = refresh;

      function getRules() {
        var el = document.getElementById("cf_discount_rules");
        if (!el) return [];
        try { return JSON.parse(el.value || "[]"); } catch (e) { return []; }
      }
      function setRules(rules) {
        var el = document.getElementById("cf_discount_rules");
        if (el) el.value = JSON.stringify(rules);
        var tbl = document.getElementById("cf_discount_rules_table");
        if (tbl) tbl.innerHTML = discountRulesTableHtml(rules);
      }
      var modal = document.querySelector(".poc_modal");
      if (modal && !modal._ruleHandlerBound) {
        modal._ruleHandlerBound = true;
        modal.addEventListener("click", function (ev) {
          var btn = ev.target.closest(".btn-remove-discount-rule");
          if (!btn) return;
          ev.preventDefault();
          var rules = getRules();
          rules.splice(Number(btn.dataset.idx), 1);
          setRules(rules);
        });
      }
      var addRuleBtn = document.querySelector(".btn-add-discount-rule");
      if (addRuleBtn) {
        addRuleBtn.onclick = function () {
          var tt = document.getElementById("nr_target_type");
          var tn = document.getElementById("nr_target_name");
          var dt = document.getElementById("nr_dtype");
          var dv = document.getElementById("nr_dval");
          var name = tn ? tn.value.trim() : "";
          var val = parseFloat(dv ? dv.value : "0") || 0;
          if (!name && (tt ? tt.value : "all") !== "all") { BillingUI.toast("Informe o nome do produto ou categoria.", "warn"); return; }
          if (!(val > 0)) { BillingUI.toast("Informe um valor de desconto maior que zero.", "warn"); return; }
          var rules = getRules();
          rules.push({
            id: BillingStore.uid("dr"),
            target_type: tt ? tt.value : "product",
            target_name: name || "Todos",
            discount_type: dt ? dt.value : "fixed_per_unit",
            discount_unit: "L",
            discount_value: val,
            priority: rules.length + 1
          });
          setRules(rules);
          if (tn) tn.value = "";
          if (dv) dv.value = "";
        };
      }
    }

    function readConfigForm(existing) {
      var g = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
      var isCustom = g("cf_period") === "custom";
      var rulesEl = document.getElementById("cf_discount_rules");
      var rules = [];
      try { rules = JSON.parse(rulesEl ? rulesEl.value || "[]" : "[]"); } catch (e) { rules = []; }
      return {
        id: existing ? existing.id : BillingStore.uid("cfg"),
        name: g("cf_name").trim(),
        subtitle: existing ? existing.subtitle : "",
        charge_type: g("cf_charge"),
        billing_period: g("cf_period"),
        period_start_day: isCustom ? parseInt(g("cf_startday"), 10) || null : null,
        period_end_day: isCustom ? parseInt(g("cf_endday"), 10) || null : null,
        adjustment_type: "none",
        adjustment_mode: "percentage",
        adjustment_value: 0,
        credit_limit: g("cf_limit") === "" ? null : Number(g("cf_limit")),
        due_days_after_period: parseInt(g("cf_due_days"), 10) || 10,
        block_on_overdue: !!(document.getElementById("cf_block_overdue") && document.getElementById("cf_block_overdue").checked),
        valid_from: g("cf_from"),
        valid_until: g("cf_to"),
        status: g("cf_status"),
        notes: g("cf_notes"),
        discount_rules: rules,
        deleted_at: existing ? existing.deleted_at : null
      };
    }

    function openConfigModal(existing) {
      BillingUI.openModal(
        existing ? "Editar modelo de faturamento" : "Novo modelo de faturamento",
        configFormHtml(existing),
        function () {
          var cfg = readConfigForm(existing);
          var err = BillingStore.validateConfiguration(cfg, existing ? existing.id : null);
          if (err) { BillingUI.toast(err, "error"); return false; }
          var d = BillingStore.getData();
          if (existing) {
            var idx = d.configurations.findIndex(function (x) { return x.id === existing.id; });
            d.configurations[idx] = cfg;
          } else {
            d.configurations.push(cfg);
          }
          BillingStore.setData(BillingStore.syncOpenCycles(d));
          render();
          BillingUI.toast(existing ? "Modelo atualizado." : "Modelo criado.", "success");
        },
        { size: "lg" }
      );
      setTimeout(bindConfigFormBehavior, 100);
    }

    function linkFormHtml(configId, l) {
      l = l || {};
      var d = BillingStore.getData();
      var s = BillingUI.sel;
      var compOpts = d.companies.map(function (c) { return '<option value="' + c.id + '"' + s(l.company_id, c.id) + ">" + BillingUI.esc(c.name) + "</option>"; }).join("");
      var hasAdj = l.specific_adjustment_type && l.specific_adjustment_type !== "none";
      var isFixed = l.specific_adjustment_mode === "fixed_amount";
      var lkRules = l.discount_rules || [];
      var lkRulesJson = JSON.stringify(lkRules).replace(/"/g, "&quot;");
      return (
        '<p class="text-muted" style="margin-bottom:14px">O vínculo associa uma empresa e sua frota a este modelo. Cada vínculo ativo gera automaticamente um faturamento em aberto por período. Os descontos por produto definidos aqui <strong>sobrescrevem</strong> os do modelo.</p>' +
        '<div class="row">' +
        '<div class="col-md-6"><div class="form-group"><label>Empresa *</label><select class="form-control" id="lk_company"><option value="">Selecione...</option>' + compOpts + "</select></div></div>" +
        '<div class="col-md-6"><div class="form-group"><label>CNPJ</label><input type="text" class="form-control" id="lk_cnpj" value="" readonly placeholder="Preenchido automaticamente"></div></div>' +
        '<div class="col-md-6"><div class="form-group"><label>Frota *</label><select class="form-control" id="lk_fleet" disabled><option value="">Selecione a empresa primeiro</option></select></div></div>' +
        '<div class="col-md-6"><div class="form-group"><label>Limite de crédito específico (R$)</label><input type="number" min="0" step="0.01" class="form-control" id="lk_limit" value="' + (l.specific_credit_limit === null || l.specific_credit_limit === undefined ? "" : l.specific_credit_limit) + '" placeholder="Usar limite padrão do modelo"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Ajuste global específico</label><select class="form-control" id="lk_adjtype">' +
        '<option value="none"' + s(l.specific_adjustment_type, "none") + ">Nenhum (usar padrão)</option>" +
        '<option value="discount"' + s(l.specific_adjustment_type, "discount") + ">Desconto global (%/R$)</option>" +
        '<option value="increase"' + s(l.specific_adjustment_type, "increase") + ">Acréscimo global (%/R$)</option>" +
        "</select></div></div>" +
        '<div class="col-md-2" id="lk_adjmode_wrap" style="display:' + (hasAdj ? "block" : "none") + '"><div class="form-group"><label>Modo</label><select class="form-control" id="lk_adjmode">' +
        '<option value="percentage"' + s(l.specific_adjustment_mode, "percentage") + ">%</option>" +
        '<option value="fixed_amount"' + s(l.specific_adjustment_mode, "fixed_amount") + ">R$</option>" +
        "</select></div></div>" +
        '<div class="col-md-2" id="lk_adjval_wrap" style="display:' + (hasAdj ? "block" : "none") + '"><div class="form-group"><label id="lk_adjval_label">' + (isFixed ? "Valor (R$)" : "Valor (%)") + '</label><input type="number" min="0" step="0.01" class="form-control" id="lk_adjval" value="' + (l.specific_adjustment_value || 0) + '"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Vigência inicial *</label><input type="date" class="form-control" id="lk_from" value="' + (l.valid_from || "") + '"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Vigência final</label><input type="date" class="form-control" id="lk_to" value="' + (l.valid_until || "") + '"></div></div>' +
        '<div class="col-md-4"><div class="form-group"><label>Status *</label><select class="form-control" id="lk_status">' +
        '<option value="active"' + s(l.status, "active") + ">Ativo</option>" +
        '<option value="inactive"' + s(l.status, "inactive") + ">Inativo</option>" +
        "</select></div></div>" +
        "</div>" +
        '<hr style="margin:10px 0"><h5 style="margin-bottom:10px"><i class="fa fa-tag"></i> Descontos por produto deste vínculo</h5>' +
        '<div class="alert alert-info poc-alert-compact"><i class="fa fa-info-circle"></i> Descontos específicos para esta empresa/frota. Quando definidos aqui, <strong>substituem</strong> os do modelo de faturamento. Ex.: R$ 0,02/L no Diesel S10.</div>' +
        '<input type="hidden" id="lk_discount_rules" value="' + lkRulesJson + '">' +
        '<div id="lk_discount_rules_table">' + discountRulesTableHtml(lkRules, "btn-remove-link-discount-rule") + "</div>" +
        '<div class="row" style="margin-top:10px;background:#f8fafc;padding:10px;border-radius:6px;border:1px solid #e2e8f0">' +
        '<div class="col-md-3"><div class="form-group" style="margin:0"><label style="font-size:12px">Alvo</label><select class="form-control input-sm" id="lk_nr_target_type"><option value="product">Produto específico</option><option value="category">Categoria</option><option value="all">Todos os produtos</option></select></div></div>' +
        '<div class="col-md-3"><div class="form-group" style="margin:0"><label style="font-size:12px">Nome do produto/categoria</label><input type="text" class="form-control input-sm" id="lk_nr_target_name" placeholder="ex: Diesel S10"></div></div>' +
        '<div class="col-md-2"><div class="form-group" style="margin:0"><label style="font-size:12px">Tipo</label><select class="form-control input-sm" id="lk_nr_dtype"><option value="fixed_per_unit">Fixo por unidade (R$/L)</option><option value="percentage">Percentual (%)</option></select></div></div>' +
        '<div class="col-md-2"><div class="form-group" style="margin:0"><label style="font-size:12px">Valor</label><input type="number" min="0" step="0.001" class="form-control input-sm" id="lk_nr_dval" placeholder="0.02"></div></div>' +
        '<div class="col-md-2" style="padding-top:20px"><button type="button" class="btn btn-primary btn-sm btn-add-link-discount-rule" style="width:100%"><i class="fa fa-plus"></i> Adicionar</button></div>' +
        "</div>"
      );
    }

    function bindLinkFormBehavior(selectedCompanyId, selectedFleetId) {
      var companySel = document.getElementById("lk_company");
      var fleetSel = document.getElementById("lk_fleet");
      var cnpj = document.getElementById("lk_cnpj");
      var adjtype = document.getElementById("lk_adjtype");
      var adjmode = document.getElementById("lk_adjmode");
      function refreshFleets() {
        var companyId = companySel.value;
        var comp = companyId ? BillingStore.companyById(companyId) : null;
        cnpj.value = comp ? comp.cnpj : "";
        if (!companyId) {
          fleetSel.innerHTML = '<option value="">Selecione a empresa primeiro</option>';
          fleetSel.disabled = true;
          return;
        }
        var fleets = BillingStore.fleetsForCompany(companyId);
        fleetSel.disabled = false;
        fleetSel.innerHTML = '<option value="">Selecione...</option>' + fleets.map(function (f) {
          return '<option value="' + f.id + '"' + (f.id === selectedFleetId ? " selected" : "") + ">" + BillingUI.esc(f.name) + "</option>";
        }).join("");
      }
      function refreshAdj() {
        var hasAdj = adjtype.value !== "none";
        document.getElementById("lk_adjmode_wrap").style.display = hasAdj ? "block" : "none";
        document.getElementById("lk_adjval_wrap").style.display = hasAdj ? "block" : "none";
        document.getElementById("lk_adjval_label").textContent = adjmode.value === "fixed_amount" ? "Valor (R$)" : "Valor (%)";
      }
      companySel.onchange = function () { selectedFleetId = null; refreshFleets(); };
      adjtype.onchange = refreshAdj;
      adjmode.onchange = refreshAdj;
      if (selectedCompanyId) { companySel.value = selectedCompanyId; refreshFleets(); }

      function getLkRules() {
        var el = document.getElementById("lk_discount_rules");
        if (!el) return [];
        try { return JSON.parse(el.value || "[]"); } catch (e) { return []; }
      }
      function setLkRules(rules) {
        var el = document.getElementById("lk_discount_rules");
        if (el) el.value = JSON.stringify(rules);
        var tbl = document.getElementById("lk_discount_rules_table");
        if (tbl) tbl.innerHTML = discountRulesTableHtml(rules, "btn-remove-link-discount-rule");
      }
      var modal = document.querySelector(".poc_modal");
      if (modal && !modal._lkRuleHandlerBound) {
        modal._lkRuleHandlerBound = true;
        modal.addEventListener("click", function (ev) {
          var btn = ev.target.closest(".btn-remove-link-discount-rule");
          if (!btn) return;
          ev.preventDefault();
          var rules = getLkRules();
          rules.splice(Number(btn.dataset.idx), 1);
          setLkRules(rules);
        });
      }
      var addRuleBtn = document.querySelector(".btn-add-link-discount-rule");
      if (addRuleBtn) {
        addRuleBtn.onclick = function () {
          var tt = document.getElementById("lk_nr_target_type");
          var tn = document.getElementById("lk_nr_target_name");
          var dt = document.getElementById("lk_nr_dtype");
          var dv = document.getElementById("lk_nr_dval");
          var name = tn ? tn.value.trim() : "";
          var val = parseFloat(dv ? dv.value : "0") || 0;
          if (!name && (tt ? tt.value : "all") !== "all") { BillingUI.toast("Informe o nome do produto ou categoria.", "warn"); return; }
          if (!(val > 0)) { BillingUI.toast("Informe um valor de desconto maior que zero.", "warn"); return; }
          var rules = getLkRules();
          rules.push({
            id: BillingStore.uid("dr"),
            target_type: tt ? tt.value : "product",
            target_name: name || "Todos",
            discount_type: dt ? dt.value : "fixed_per_unit",
            discount_unit: "L",
            discount_value: val,
            priority: rules.length + 1
          });
          setLkRules(rules);
          if (tn) tn.value = "";
          if (dv) dv.value = "";
        };
      }
    }

    function openLinkModal(configId, existing) {
      var cfg = BillingStore.configById(configId);
      BillingUI.openModal(
        (existing ? "Editar vínculo" : "Novo vínculo") + " — " + BillingUI.esc(cfg.name),
        linkFormHtml(configId, existing),
        function () {
          var g = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
          var comp = BillingStore.companyById(g("lk_company"));
          var lkRulesEl = document.getElementById("lk_discount_rules");
          var lkRules = [];
          try { lkRules = JSON.parse(lkRulesEl ? lkRulesEl.value || "[]" : "[]"); } catch (e) { lkRules = []; }
          var link = {
            id: existing ? existing.id : BillingStore.uid("lnk"),
            configuration_id: configId,
            customer_id: existing ? existing.customer_id : null,
            company_id: g("lk_company"),
            fleet_id: g("lk_fleet"),
            specific_adjustment_type: g("lk_adjtype"),
            specific_adjustment_mode: g("lk_adjmode") || "percentage",
            specific_adjustment_value: g("lk_adjtype") === "none" ? 0 : Number(g("lk_adjval") || 0),
            specific_credit_limit: g("lk_limit") === "" ? null : Number(g("lk_limit")),
            valid_from: g("lk_from"),
            valid_until: g("lk_to") || null,
            status: g("lk_status"),
            discount_rules: lkRules
          };
          var err = BillingStore.validateLink(link, existing ? existing.id : null);
          if (err) { BillingUI.toast(err, "error"); return false; }
          var d = BillingStore.getData();
          if (existing) {
            var idx = d.links.findIndex(function (x) { return x.id === existing.id; });
            d.links[idx] = link;
          } else {
            d.links.push(link);
          }
          BillingStore.setData(BillingStore.syncOpenCycles(d));
          render();
          BillingUI.toast(existing ? "Vínculo atualizado." : "Vínculo criado. Faturamento em aberto gerado automaticamente.", "success");
        },
        { size: "lg" }
      );
      setTimeout(function () {
        bindLinkFormBehavior(existing ? existing.company_id : null, existing ? existing.fleet_id : null);
      }, 100);
    }

    function populateFilters() {
      var d = BillingStore.getData();
      var fill = function (id, items, label) {
        var el = document.getElementById(id);
        if (!el) return;
        var current = el.value;
        el.innerHTML = '<option value="">Todos</option>' + items.map(function (x) {
          return '<option value="' + x.id + '">' + BillingUI.esc(label(x)) + "</option>";
        }).join("");
        el.value = current;
      };
      fill("flt-company", d.companies, function (x) { return x.name; });
      fill("flt-fleet", d.fleets, function (x) { return x.name; });
    }

    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var expandBtn = t.closest(".bill-expand-btn:not(.bill-expand-btn--demo)");
      if (expandBtn && expandBtn.dataset.id) { toggleExpandRow(expandBtn.dataset.id); return; }
      var addLink = t.closest(".btn-add-link");
      if (addLink) { openLinkModal(addLink.dataset.configId); return; }
      var addLinkCfg = t.closest(".btn-add-link-cfg");
      if (addLinkCfg) { e.preventDefault(); openLinkModal(addLinkCfg.dataset.id); return; }
      var editLink = t.closest(".btn-edit-link");
      if (editLink) {
        var l = BillingStore.linkById(editLink.dataset.id);
        if (l) openLinkModal(l.configuration_id, l);
        return;
      }
      var removeLink = t.closest(".btn-remove-link");
      if (removeLink) {
        if (!confirm("Remover este vínculo do modelo?\n\nOs faturamentos em aberto serão encerrados. O vínculo permanecerá visível (destacado) até o fechamento do último faturamento gerado por ele.")) return;
        var d = BillingStore.getData();
        var lk = d.links.filter(function (x) { return x.id === removeLink.dataset.id; })[0];
        if (lk) {
          lk.status = "inactive";
          BillingStore.removeOpenCyclesForLink(d, lk.id);
          BillingStore.setData(BillingStore.syncOpenCycles(d));
          render();
          var cfg = BillingStore.configById(lk.configuration_id);
          expanded[lk.configuration_id] = true;
          render();
          BillingUI.toast("Vínculo removido. Após o fechamento do último faturamento, ele deixará de aparecer nesta lista.", "warn");
        }
        return;
      }
      var editCfg = t.closest(".btn-edit-cfg");
      if (editCfg) { openConfigModal(BillingStore.configById(editCfg.dataset.id)); return; }
      var toggleCfg = t.closest(".btn-toggle-cfg");
      if (toggleCfg) {
        var dd = BillingStore.getData();
        var cfg = dd.configurations.filter(function (x) { return x.id === toggleCfg.dataset.id; })[0];
        if (!cfg) return;
        if (cfg.status === "active") {
          if (!confirm("Inativar este modelo? Os faturamentos em aberto dos vínculos serão removidos.")) return;
          BillingStore.inactivateConfiguration(dd, cfg.id);
        } else {
          cfg.status = "active";
          BillingStore.syncOpenCycles(dd);
        }
        BillingStore.setData(dd);
        render();
        BillingUI.toast(cfg.status === "active" ? "Modelo ativado." : "Modelo inativado.", "success");
        return;
      }
      if (t.closest("#btn-add-config")) { e.preventDefault(); openConfigModal(null); }
    });

    ["flt-company", "flt-fleet", "flt-period", "flt-status", "flt-validity"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("change", render);
    });

    populateFilters();
    render();
    BillingUI.bindSearch("search-configs", "tbody-configs");
  },

  gestao: function () {
    var currentTab = "open";
    var d0 = BillingStore.syncOpenCycles(BillingStore.getData());
    BillingStore.setData(d0);

    function nowIso() { return new Date().toISOString(); }

    function addHistory(d, cycleId, action, detail) {
      d.history.push({ id: BillingStore.uid("h"), cycle_id: cycleId, action: action, at: nowIso(), user: "Admin", detail: detail });
    }

    function cyclePassesFilters(c) {
      var v = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
      if (currentTab === "open" && !BillingStore.isOpenCycleStatus(c.status)) return false;
      if (currentTab === "closed" && !BillingStore.isClosedGroupStatus(c.status)) return false;
      if (v("flt-c-company") && c.company_id !== v("flt-c-company")) return false;
      if (v("flt-c-fleet")   && c.fleet_id   !== v("flt-c-fleet"))   return false;
      if (v("flt-c-config")  && c.configuration_id !== v("flt-c-config")) return false;
      if (v("flt-c-status")  && c.status     !== v("flt-c-status"))   return false;
      if (v("flt-c-due")     && c.due_date   !== v("flt-c-due"))      return false;
      if (v("flt-c-min") !== "" && Number(c.net_amount) < Number(v("flt-c-min"))) return false;
      if (v("flt-c-max") !== "" && Number(c.net_amount) > Number(v("flt-c-max"))) return false;
      var sent = v("flt-c-sent");
      if (sent === "yes" && !c.sent_at) return false;
      if (sent === "no" && c.sent_at) return false;
      return true;
    }

    function actionDropdown(c) {
      var id = c.id;
      var items = [];
      items.push('<li><a href="#" class="btn-detail-cycle" data-id="' + id + '"><i class="fa fa-search"></i> Detalhes</a></li>');
      if (BillingStore.isOpenCycleStatus(c.status)) {
        items.push('<li><a href="#" class="btn-advance-cycle" data-id="' + id + '" style="color:#7c3aed"><i class="fa fa-bolt"></i> Antecipar faturamento</a></li>');
        items.push('<li class="divider"></li>');
        items.push('<li><a href="#" class="btn-close-send-cycle" data-id="' + id + '" style="color:#1d4ed8"><i class="fa fa-lock"></i> Fechar e enviar</a></li>');
      }
      if (c.status === "closed") {
        items.push('<li class="divider"></li>');
        items.push('<li><a href="#" class="btn-send-cycle" data-id="' + id + '"><i class="fa fa-envelope-o"></i> Enviar fatura</a></li>');
      }
      if (c.status === "sent" || c.status === "resent" || c.status === "overdue") {
        items.push('<li class="divider"></li>');
        items.push('<li><a href="#" class="btn-send-cycle" data-id="' + id + '"><i class="fa fa-repeat"></i> Reenviar fatura</a></li>');
      }
      var canPay = ["closed", "sent", "resent", "overdue"].indexOf(c.status) >= 0;
      if (canPay) {
        items.push('<li><a href="#" class="btn-paid-cycle" data-id="' + id + '" style="color:#059669"><i class="fa fa-check-circle"></i> Marcar como Pago</a></li>');
      }
      if (BillingStore.isClosedGroupStatus(c.status)) {
        items.push('<li class="divider"></li>');
        items.push('<li><a href="#" class="btn-reopen-cycle" data-id="' + id + '" style="color:#b45309"><i class="fa fa-undo"></i> Reabrir faturamento</a></li>');
      }
      return (
        '<div class="btn-group">' +
        '<button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
        'Ações <span class="caret"></span></button>' +
        '<ul class="dropdown-menu dropdown-menu-right">' + items.join("") + "</ul>" +
        "</div>"
      );
    }

    function render() {
      var d = BillingStore.applyOverdueStatus(BillingStore.getData());
      BillingStore.setData(d);
      var tbody = document.getElementById("tbody-cycles");
      if (!tbody) return;
      var all = d.cycles.filter(function (c) {
        return currentTab === "open" ? BillingStore.isOpenCycleStatus(c.status) : BillingStore.isClosedGroupStatus(c.status);
      });
      var filtered = d.cycles.filter(cyclePassesFilters);
      filtered.sort(function (a, b) {
        if (b.reference_start > a.reference_start) return 1;
        if (b.reference_start < a.reference_start) return -1;
        return b.id > a.id ? 1 : -1;
      });
      var rows = filtered.map(function (c) {
        var comp = BillingStore.companyById(c.company_id);
        var fleet = BillingStore.fleetById(c.fleet_id);
        var cfg = BillingStore.configById(c.configuration_id);
        var adj = Number(c.discount_amount) > 0
          ? '<span class="bill-adj-down">− ' + BillingStore.formatMoney(c.discount_amount) + "</span>"
          : Number(c.increase_amount) > 0
            ? '<span class="bill-adj-up">+ ' + BillingStore.formatMoney(c.increase_amount) + "</span>"
            : "—";
        return (
          '<tr class="bill-main-row" data-id="' + c.id + '">' +
          "<td><code class='text-muted' style='font-size:11px'>" + (c.billing_code || "—") + "</code></td>" +
          "<td><strong>" + (comp ? BillingUI.esc(comp.name) : "—") + "</strong><br><small class='text-muted'>" + (comp ? comp.client_code + " · " + comp.cnpj : "") + "</small></td>" +
          "<td>" + (fleet ? BillingUI.esc(fleet.name) : "—") + "</td>" +
          "<td>" + (cfg ? BillingUI.esc(cfg.name) : "—") + "</td>" +
          "<td>" + BillingStore.formatDateRange(c.reference_start, c.reference_end) + "</td>" +
          "<td>" + c.invoice_count + "</td>" +
          "<td>" + BillingStore.formatMoney(c.gross_amount) + "</td>" +
          "<td>" + adj + "</td>" +
          "<td><strong>" + BillingStore.formatMoney(c.net_amount) + "</strong></td>" +
          "<td>" + BillingStore.formatDate(c.due_date) + "</td>" +
          "<td>" + BillingLabels.cycleStatus(c.status) + "</td>" +
          "<td>" + (c.last_sent_at ? BillingUI.formatDateTime(c.last_sent_at) : '<span class="text-muted">—</span>') + "</td>" +
          '<td class="bill-col-actions">' + actionDropdown(c) + "</td>" +
          "</tr>"
        );
      });
      tbody.innerHTML = rows.length ? rows.join("") : '<tr><td colspan="13" class="text-center text-muted" style="padding:24px">Nenhum faturamento ' + (currentTab === "open" ? "em aberto" : "fechado") + " encontrado.</td></tr>";
      var info = document.getElementById("cycle-count-info");
      if (info) {
        info.textContent = filtered.length === all.length
          ? "Mostrando " + all.length + " registro(s)"
          : "Mostrando " + filtered.length + " de " + all.length + " registro(s) (filtros aplicados)";
      }
    }

    function detailHeaderHtml(c) {
      var comp = BillingStore.companyById(c.company_id);
      var fleet = BillingStore.fleetById(c.fleet_id);
      var cfg = BillingStore.configById(c.configuration_id);
      return (
        '<div class="bill-detail-header">' +
        '<div class="row">' +
        '<div class="col-md-4"><strong>Empresa:</strong> ' + (comp ? BillingUI.esc(comp.name) : "—") + "</div>" +
        '<div class="col-md-4"><strong>CNPJ:</strong> ' + (comp ? comp.cnpj : "—") + "</div>" +
        '<div class="col-md-4"><strong>E-mail:</strong> ' + (comp ? comp.email : "—") + "</div>" +
        '<div class="col-md-4"><strong>Frota:</strong> ' + (fleet ? BillingUI.esc(fleet.name) : "—") + "</div>" +
        '<div class="col-md-4"><strong>Modelo:</strong> ' + (cfg ? BillingUI.esc(cfg.name) : "—") + "</div>" +
        "</div>" +
        '<div class="bill-detail-totals">' +
        "<span><strong>Código:</strong> <code>" + (c.billing_code || "—") + "</code></span>" +
        "<span><strong>Período:</strong> " + BillingStore.formatDateRange(c.reference_start, c.reference_end) + "</span>" +
        "<span><strong>Status:</strong> " + BillingLabels.cycleStatus(c.status) + "</span>" +
        "<span><strong>Valor total:</strong> " + BillingStore.formatMoney(c.net_amount) + "</span>" +
        "<span><strong>Vencimento:</strong> " + BillingStore.formatDate(c.due_date) + "</span>" +
        "</div></div>"
      );
    }

    function tabResumo(c) {
      var consumoCount = BillingStore.activeItemsForCycle(c.id).length;
      return (
        '<ul class="bill-summary-list">' +
        "<li><span>Valor bruto</span><strong>" + BillingStore.formatMoney(c.gross_amount) + "</strong></li>" +
        '<li><span>Descontos</span><strong class="bill-adj-down">− ' + BillingStore.formatMoney(c.discount_amount) + "</strong></li>" +
        '<li><span>Acréscimos</span><strong class="bill-adj-up">+ ' + BillingStore.formatMoney(c.increase_amount) + "</strong></li>" +
        "<li><span>Valor líquido</span><strong>" + BillingStore.formatMoney(c.net_amount) + "</strong></li>" +
        "<li><span>Quantidade de notas</span><strong>" + c.invoice_count + "</strong></li>" +
        "<li><span>Quantidade de consumos</span><strong>" + consumoCount + "</strong></li>" +
        "<li><span>Período de referência</span><strong>" + BillingStore.formatDateRange(c.reference_start, c.reference_end) + "</strong></li>" +
        "<li><span>Status</span>" + BillingLabels.cycleStatus(c.status) + "</li>" +
        "<li><span>Boleto vinculado</span><strong>" + (c.boleto_id || '<span class="text-muted">Gerado no fechamento</span>') + "</strong></li>" +
        "<li><span>Link do portal</span>" + (c.portal_link ? '<a href="#" onclick="return false">' + BillingUI.esc(c.portal_link) + "</a>" : '<span class="text-muted">Disponível após o fechamento</span>') + "</li>" +
        "</ul>"
      );
    }

    function nfeXmlSample(item) {
      return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">',
        '  <!-- ⚠️  DADOS SIMULADOS — POC DE DEMONSTRAÇÃO -->',
        '  <NFe>',
        '    <infNFe Id="NFe' + item.nfe_key + '" versao="4.00">',
        '      <ide>',
        '        <cUF>35</cUF>',
        '        <nNF>' + item.nfe_number + '</nNF>',
        '        <serie>' + item.nfe_series + '</serie>',
        '        <dhEmi>' + item.issue_date + 'T00:00:00-03:00</dhEmi>',
        '        <natOp>VENDA DE COMBUSTIVEL</natOp>',
        '      </ide>',
        '      <dest>',
        '        <!-- Empresa faturada preenchida no sistema real -->',
        '      </dest>',
        '      <det nItem="1">',
        '        <prod>',
        '          <xProd>' + item.product + '</xProd>',
        '          <qCom>' + item.quantity + '</qCom>',
        '          <vUnCom>' + item.unit_price + '</vUnCom>',
        '          <vProd>' + item.gross_amount + '</vProd>',
        '        </prod>',
        '        <veicTransp>',
        '          <placa>' + item.plate + '</placa>',
        '        </veicTransp>',
        '      </det>',
        '      <total>',
        '        <ICMSTot><vNF>' + item.gross_amount + '</vNF></ICMSTot>',
        '      </total>',
        '    </infNFe>',
        '  </NFe>',
        '</nfeProc>'
      ].join("\n");
    }

    function tabNfe(c, editable) {
      var items = BillingStore.itemsForCycle(c.id);
      var rows = items.map(function (i) {
        var removed = i.status === "removed";
        var style = removed ? ' style="opacity:.5;text-decoration:line-through"' : "";
        var actions = '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline btn-view-nfe" data-id="' + i.id + '"><i class="fa fa-eye"></i> Abrir</button>';
        if (editable && !removed) {
          actions += ' <button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline btn-remove-item" data-id="' + i.id + '"><i class="fa fa-trash-o"></i> Remover</button>';
        }
        var statusLbl = removed
          ? '<span class="label label-default" title="Removida em ' + BillingUI.formatDateTime(i.removed_at) + '">Removida</span>'
          : '<span class="label label-success">Emitida</span>' + (i.manually_added ? ' <span class="label label-info">Manual</span>' : "");
        return (
          "<tr" + style + ">" +
          "<td>" + i.nfe_number + "</td>" +
          "<td>" + i.nfe_series + "</td>" +
          "<td><code style='font-size:10px'>" + i.nfe_key.substring(0, 20) + "…</code></td>" +
          "<td>" + BillingStore.formatDate(i.issue_date) + "</td>" +
          "<td>" + BillingStore.formatMoney(i.gross_amount) + "</td>" +
          "<td>" + statusLbl + "</td>" +
          "<td>" + BillingUI.esc(i.plate) + "</td>" +
          "<td>" + (removed ? "" : actions) + "</td></tr>"
        );
      }).join("");
      var addBtn = editable
        ? '<p style="margin-top:10px"><button type="button" class="tw-dw-btn tw-dw-btn-xs tw-bg-gradient-to-r tw-from-indigo-600 tw-to-blue-500 tw-text-white tw-border-none tw-rounded-full btn-add-item" data-cycle="' + c.id + '"><i class="fa fa-plus"></i> Adicionar nota</button></p>'
        : "";
      return (
        '<div class="table-responsive"><table class="table table-bordered bill-subtable">' +
        "<thead><tr><th>Número</th><th>Série</th><th>Chave NF-e</th><th>Emissão</th><th>Valor</th><th>Status</th><th>Veículo</th><th>Ações</th></tr></thead>" +
        "<tbody>" + (rows || '<tr><td colspan="8" class="text-center text-muted">Nenhuma nota vinculada.</td></tr>') + "</tbody></table></div>" +
        '<p class="text-muted">Total de notas ativas: <strong>' + BillingStore.activeItemsForCycle(c.id).length + "</strong></p>" +
        addBtn
      );
    }

    function tabConsumo(c) {
      var items = BillingStore.activeItemsForCycle(c.id);
      var rows = items.map(function (i) {
        return (
          "<tr><td>" + BillingStore.formatDate(i.issue_date) + "</td>" +
          "<td>" + BillingUI.esc(i.plate) + "</td>" +
          "<td>" + BillingUI.esc(i.driver) + "</td>" +
          "<td>" + BillingUI.esc(i.product) + "</td>" +
          "<td>" + Number(i.quantity).toLocaleString("pt-BR") + " L</td>" +
          "<td>" + BillingStore.formatMoney(i.unit_price) + "</td>" +
          "<td>" + BillingStore.formatMoney(i.gross_amount) + "</td>" +
          "<td>NF-e " + i.nfe_number + "</td></tr>"
        );
      }).join("");
      var total = items.reduce(function (s, i) { return s + Number(i.gross_amount); }, 0);
      return (
        '<div class="table-responsive"><table class="table table-bordered bill-subtable">' +
        "<thead><tr><th>Data</th><th>Placa / Veículo</th><th>Motorista</th><th>Produto</th><th>Quantidade</th><th>Preço unitário</th><th>Total</th><th>Nota vinculada</th></tr></thead>" +
        "<tbody>" + (rows || '<tr><td colspan="8" class="text-center text-muted">Nenhum consumo registrado.</td></tr>') + "</tbody>" +
        "<tfoot><tr><th colspan=\"6\" class=\"text-right\">Total do consumo</th><th>" + BillingStore.formatMoney(total) + "</th><th></th></tr></tfoot>" +
        "</table></div>"
      );
    }

    function tabAjustes(c, editable) {
      var link = BillingStore.linkById(c.link_id);
      var cfg = BillingStore.configById(c.configuration_id);
      var eff = BillingStore.effectiveAdjustment(c, link, cfg);
      var effTxt = eff.source === "manual" ? "Ajuste manual aplicado neste faturamento"
        : eff.source === "link" ? "Ajuste específico do vínculo: " + BillingLabels.adjustment(eff.type, eff.mode, eff.value)
        : eff.source === "config" ? "Ajuste padrão do modelo: " + BillingLabels.adjustment(eff.type, eff.mode, eff.value)
        : "Nenhum ajuste aplicado";

      var rules = cfg ? (cfg.discount_rules || []) : [];
      var items = BillingStore.activeItemsForCycle(c.id);
      var rulesSectionHtml = "";
      if (rules.length) {
        var ruleRows = rules.map(function (r) {
          var matchItems = items.filter(function (i) {
            if (r.target_type === "all") return true;
            return i.product && i.product.toLowerCase().indexOf(r.target_name.toLowerCase()) >= 0;
          });
          var qty = matchItems.reduce(function (s, i) { return s + Number(i.quantity || 0); }, 0);
          var gross = matchItems.reduce(function (s, i) { return s + Number(i.gross_amount || 0); }, 0);
          var calc = r.discount_type === "fixed_per_unit" ? qty * r.discount_value : gross * r.discount_value / 100;
          var desc = r.discount_type === "fixed_per_unit"
            ? "R$ " + r.discount_value.toFixed(3) + "/" + (r.discount_unit || "un") + " × " + Number(qty).toLocaleString("pt-BR") + " " + (r.discount_unit || "un")
            : r.discount_value.toFixed(2) + "% sobre " + BillingStore.formatMoney(gross);
          var badge = r.target_type === "product" ? "Produto" : r.target_type === "category" ? "Categoria" : "Global";
          return "<tr>" +
            "<td><span class='label label-default'>" + badge + "</span> <strong>" + BillingUI.esc(r.target_name) + "</strong></td>" +
            "<td>" + desc + "</td>" +
            "<td class='text-right'>" + (calc > 0 ? '<span class="bill-adj-down">− ' + BillingStore.formatMoney(calc) + "</span>" : '<span class="text-muted">R$ 0,00 (sem itens)</span>') + "</td>" +
            "</tr>";
        }).join("");
        var totalRuleDiscount = rules.reduce(function (s, r) {
          var matchItems = items.filter(function (i) {
            if (r.target_type === "all") return true;
            return i.product && i.product.toLowerCase().indexOf(r.target_name.toLowerCase()) >= 0;
          });
          var qty = matchItems.reduce(function (acc, i) { return acc + Number(i.quantity || 0); }, 0);
          var gross = matchItems.reduce(function (acc, i) { return acc + Number(i.gross_amount || 0); }, 0);
          return s + (r.discount_type === "fixed_per_unit" ? qty * r.discount_value : gross * r.discount_value / 100);
        }, 0);
        rulesSectionHtml =
          '<h5 style="margin:14px 0 8px"><i class="fa fa-tag"></i> Descontos por produto (Vendas → Descontos)</h5>' +
          '<div class="table-responsive"><table class="table table-condensed table-bordered bill-subtable">' +
          "<thead><tr><th>Produto / Categoria</th><th>Cálculo</th><th class='text-right'>Desconto calculado</th></tr></thead>" +
          "<tbody>" + ruleRows + "</tbody>" +
          "<tfoot><tr><th colspan='2' class='text-right'>Total de descontos por produto</th><th class='text-right'><span class='bill-adj-down'>− " + BillingStore.formatMoney(totalRuleDiscount) + "</span></th></tr></tfoot>" +
          "</table></div>" +
          '<p class="text-muted" style="font-size:12px"><i class="fa fa-info-circle"></i> Os descontos por produto são calculados automaticamente a partir das regras do modelo e aplicados no campo "Desconto manual" abaixo ao clicar em Aplicar.</p>';
      }

      var lastAdj = c.adjusted_at
        ? '<p class="text-muted"><i class="fa fa-user"></i> Último ajuste por <strong>' + BillingUI.esc(c.adjusted_by) + "</strong> em " + BillingUI.formatDateTime(c.adjusted_at) + (c.manual_adjustment_note ? ' — "' + BillingUI.esc(c.manual_adjustment_note) + '"' : "") + "</p>"
        : "";
      var totalRuleDisc = rules.reduce(function (s, r) {
        var mi = items.filter(function (i) { return r.target_type === "all" || (i.product && i.product.toLowerCase().indexOf(r.target_name.toLowerCase()) >= 0); });
        var qty = mi.reduce(function (a, i) { return a + Number(i.quantity || 0); }, 0);
        var gr = mi.reduce(function (a, i) { return a + Number(i.gross_amount || 0); }, 0);
        return s + (r.discount_type === "fixed_per_unit" ? qty * r.discount_value : gr * r.discount_value / 100);
      }, 0);
      var form = editable
        ? '<div class="row" style="margin-top:14px">' +
          '<div class="col-md-3"><div class="form-group"><label>Desconto total (R$)</label><input type="number" min="0" step="0.01" class="form-control" id="cy-discount-input" value="' + (c.discount_amount || 0) + '"></div></div>' +
          '<div class="col-md-3"><div class="form-group"><label>Acréscimo manual (R$)</label><input type="number" min="0" step="0.01" class="form-control" id="cy-increase-input" value="' + (c.increase_amount || 0) + '"></div></div>' +
          '<div class="col-md-6"><div class="form-group"><label>Justificativa *</label><input type="text" class="form-control" id="cy-adjust-note" placeholder="Obrigatória para aplicar ajuste" value="' + BillingUI.esc(c.manual_adjustment_note || "") + '"></div></div>' +
          '<div class="col-md-12">' +
          (totalRuleDisc > 0 ? '<button type="button" class="btn btn-default btn-sm btn-apply-rule-discount" data-val="' + totalRuleDisc.toFixed(2) + '" style="margin-right:8px"><i class="fa fa-tag"></i> Usar desconto calculado (' + BillingStore.formatMoney(totalRuleDisc) + ')</button>' : "") +
          '<button type="button" class="tw-dw-btn tw-dw-btn-sm tw-dw-btn-primary tw-text-white btn-apply-adjustments" data-cycle="' + c.id + '"><i class="fa fa-check"></i> Aplicar ajustes</button>' +
          "</div></div>"
        : c.status === "paid"
          ? '<div class="alert alert-success poc-alert-compact" style="margin-top:14px"><i class="fa fa-check-circle"></i> Fatura marcada como paga. Use <strong>Reabrir faturamento</strong> no rodapé caso precise corrigir.</div>'
          : '<div class="alert alert-warning poc-alert-compact" style="margin-top:14px">' +
            '<i class="fa fa-lock"></i> Fatura fechada — valores congelados.<br>' +
            '<span style="font-size:12px">Para aplicar descontos ou ajustes, use o botão <strong>Reabrir faturamento</strong> no rodapé. A fatura voltará para Em aberto e poderá ser editada antes de ser reenviada.</span>' +
            '</div>';
      var adjHistory = BillingStore.historyForCycle(c.id).filter(function (h) { return h.action === "adjustment"; });
      var histHtml = adjHistory.length
        ? '<h5 style="margin-top:18px">Histórico de ajustes</h5><ul class="bill-timeline">' + adjHistory.map(function (h) {
            return "<li><strong>" + BillingUI.formatDateTime(h.at) + "</strong> · " + BillingUI.esc(h.user) + "<br><small>" + BillingUI.esc(h.detail) + "</small></li>";
          }).join("") + "</ul>"
        : "";
      return (
        '<div class="alert alert-info poc-alert-compact"><i class="fa fa-info-circle"></i> Precedência: manual &gt; específico do vínculo &gt; padrão do modelo &gt; zero. <strong>Efetivo:</strong> ' + effTxt + "</div>" +
        rulesSectionHtml + lastAdj + form + histHtml
      );
    }

    function tabBoleto(c) {
      if (!c.boleto_id) {
        return '<div class="bill-expand-empty"><i class="fa fa-barcode fa-2x"></i><p style="margin-top:8px">O boleto é gerado no fechamento do faturamento.</p></div>';
      }
      return (
        '<ul class="bill-summary-list">' +
        "<li><span>Número do boleto</span><strong>" + c.boleto_id + "</strong></li>" +
        "<li><span>Vencimento</span><strong>" + BillingStore.formatDate(c.due_date) + "</strong></li>" +
        "<li><span>Valor</span><strong>" + BillingStore.formatMoney(c.net_amount) + "</strong></li>" +
        "<li><span>Status</span>" + (c.status === "paid" ? '<span class="label label-success">Pago / Finalizado</span>' : c.status === "overdue" ? '<span class="label label-danger">Vencido</span>' : '<span class="label label-info">Pendente</span>') + "</li>" +
        '<li><span>Link do boleto</span><a href="#" onclick="return false">https://boletos.demo.ecomercial/' + c.boleto_id.toLowerCase() + "</a></li>" +
        "</ul>"
      );
    }

    function tabEnvios(c) {
      var logs = BillingStore.logsForCycle(c.id);
      if (!logs.length) {
        return '<div class="bill-expand-empty"><i class="fa fa-envelope-o fa-2x"></i><p style="margin-top:8px">Nenhum envio registrado. O envio dispara um e-mail com o link do portal (notas, consumo e boleto).</p></div>';
      }
      var rows = logs.map(function (l) {
        return (
          "<tr><td>" + BillingUI.formatDateTime(l.sent_at) + "</td>" +
          "<td>" + BillingUI.esc(l.sent_by) + "</td>" +
          "<td>" + BillingUI.esc(l.email_to) + "</td>" +
          "<td>" + (l.status === "success" ? '<span class="label label-success">Sucesso</span>' : '<span class="label label-danger">Falha</span>') + "</td>" +
          "<td>" + (l.error_message ? BillingUI.esc(l.error_message) : "—") + "</td></tr>"
        );
      }).join("");
      return (
        '<div class="table-responsive"><table class="table table-bordered bill-subtable">' +
        "<thead><tr><th>Data/hora</th><th>Usuário</th><th>E-mail destino</th><th>Status</th><th>Erro</th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table></div>"
      );
    }

    function tabHistorico(c) {
      var hist = BillingStore.historyForCycle(c.id);
      if (!hist.length) return '<div class="bill-expand-empty">Nenhum evento registrado.</div>';
      return (
        '<ul class="bill-timeline">' + hist.map(function (h) {
          return "<li><strong>" + BillingLabels.historyAction(h.action) + "</strong> · " + BillingUI.formatDateTime(h.at) + " · " + BillingUI.esc(h.user) + "<br><small class='text-muted'>" + BillingUI.esc(h.detail) + "</small></li>";
        }).join("") + "</ul>"
      );
    }

    function tabAdiantamentos(c) {
      var advs = BillingStore.advancesForCycle(c.id);
      var totalAdv = advs.reduce(function (s, a) { return s + Number(a.amount); }, 0);
      var isOpen = BillingStore.isOpenCycleStatus(c.status);
      var addBtn = isOpen
        ? '<button type="button" class="btn btn-sm btn-warning btn-advance-cycle" data-id="' + c.id + '" style="margin-bottom:12px"><i class="fa fa-bolt"></i> Registrar adiantamento</button>'
        : "";
      if (!advs.length) {
        return addBtn + '<div class="bill-expand-empty"><i class="fa fa-bolt fa-2x"></i><p style="margin-top:8px">Nenhum adiantamento registrado para este faturamento.</p></div>';
      }
      var rows = advs.map(function (a) {
        return (
          "<tr>" +
          "<td>" + BillingUI.formatDateTime(a.registered_at) + "</td>" +
          "<td><strong>" + BillingStore.formatMoney(a.amount) + "</strong></td>" +
          "<td>" + BillingUI.esc(a.note) + "</td>" +
          "<td>" + BillingUI.esc(a.registered_by) + "</td>" +
          "</tr>"
        );
      }).join("");
      var remaining = Number(c.net_amount) - totalAdv;
      return (
        addBtn +
        '<div class="table-responsive">' +
        '<table class="table table-bordered bill-subtable">' +
        "<thead><tr><th>Data</th><th>Valor</th><th>Justificativa</th><th>Registrado por</th></tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
        "</table></div>" +
        '<ul class="bill-summary-list" style="margin-top:8px">' +
        "<li><span>Total da fatura</span><strong>" + BillingStore.formatMoney(c.net_amount) + "</strong></li>" +
        "<li><span>Total adiantado</span><strong style='color:#7c3aed'>" + BillingStore.formatMoney(totalAdv) + "</strong></li>" +
        "<li><span>Saldo pendente</span><strong style='color:" + (remaining <= 0 ? "#059669" : "#dc2626") + "'>" + BillingStore.formatMoney(Math.max(0, remaining)) + "</strong></li>" +
        "</ul>"
      );
    }

    function openDetailModal(cycleId, options) {
      options = options || {};
      var c = BillingStore.getData().cycles.filter(function (x) { return x.id === cycleId; })[0];
      if (!c) return;
      var editable = BillingStore.isOpenCycleStatus(c.status);
      var advCount = BillingStore.advancesForCycle(c.id).length;
      var tabs = [
        { id: "resumo", label: "Resumo", html: tabResumo(c) },
        { id: "nfe", label: "Notas fiscais (" + c.invoice_count + ")", html: tabNfe(c, editable) },
        { id: "consumo", label: "Consumo", html: tabConsumo(c) },
        { id: "ajustes", label: "Ajustes", html: tabAjustes(c, editable) },
        { id: "adiantamentos", label: "Adiantamentos" + (advCount ? " (" + advCount + ")" : ""), html: tabAdiantamentos(c) },
        { id: "boleto", label: "Boleto", html: tabBoleto(c) },
        { id: "envios", label: "Envios", html: tabEnvios(c) },
        { id: "historico", label: "Histórico", html: tabHistorico(c) }
      ];
      var activeTab = options.tab || "resumo";
      var navHtml = '<ul class="nav nav-tabs">' + tabs.map(function (t) {
        return '<li class="' + (t.id === activeTab ? "active" : "") + '"><a href="#bill-tab-' + t.id + '" data-toggle="tab">' + t.label + "</a></li>";
      }).join("") + "</ul>";
      var panesHtml = '<div class="tab-content bill-detail-panels">' + tabs.map(function (t) {
        return '<div class="tab-pane ' + (t.id === activeTab ? "active" : "") + '" id="bill-tab-' + t.id + '">' + t.html + "</div>";
      }).join("") + "</div>";
      var detailFooterExtra = editable
        ? '<button type="button" class="btn btn-warning btn-advance-cycle" data-id="' + cycleId + '" style="float:left"><i class="fa fa-bolt"></i> Antecipar faturamento</button>' +
          '<button type="button" class="btn btn-primary btn-close-send-cycle" data-id="' + cycleId + '" style="float:left;margin-left:6px"><i class="fa fa-lock"></i> Fechar e enviar</button>'
        : BillingStore.isClosedGroupStatus(c.status)
          ? (["closed", "sent", "resent", "overdue"].indexOf(c.status) >= 0
              ? '<button type="button" class="btn btn-default btn-send-cycle" data-id="' + cycleId + '" style="float:left"><i class="fa fa-repeat"></i> Reenviar</button>'
              : "") +
            '<button type="button" class="btn btn-warning btn-reopen-cycle" data-id="' + cycleId + '" style="float:left;margin-left:6px"><i class="fa fa-undo"></i> Reabrir faturamento</button>'
          : "";
      BillingUI.openModal("Detalhes do faturamento — <code>" + BillingUI.esc(c.billing_code || "s/código") + "</code>", detailHeaderHtml(c) + navHtml + panesHtml, null, { size: "xl", hideSave: true, extraFooter: detailFooterExtra });

      setTimeout(function () {
        var container = document.querySelector(".poc_modal");
        if (!container) return;

        container.querySelectorAll(".btn-view-nfe").forEach(function (b) {
          b.onclick = function () {
            var allItems = BillingStore.getData().cycle_items;
            var item = allItems.filter(function (x) { return x.id === b.dataset.id; })[0];
            if (!item) return;
            var xmlStr = nfeXmlSample(item);
            var xmlEscaped = xmlStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            var bodyHtml =
              '<div class="alert alert-warning poc-alert-compact"><i class="fa fa-flask"></i> <strong>POC — Dados simulados.</strong> Em produção, os dados serão obtidos da NF-e real emitida pelo sistema fiscal.</div>' +
              '<ul class="bill-summary-list" style="margin-bottom:14px">' +
              "<li><span>Número / Série</span><strong>NF-e " + item.nfe_number + " / " + item.nfe_series + "</strong></li>" +
              "<li><span>Chave NF-e</span><code style='font-size:11px;word-break:break-all'>" + item.nfe_key + "</code></li>" +
              "<li><span>Emissão</span><strong>" + BillingStore.formatDate(item.issue_date) + "</strong></li>" +
              "<li><span>Valor</span><strong>" + BillingStore.formatMoney(item.gross_amount) + "</strong></li>" +
              "<li><span>Placa</span><strong>" + BillingUI.esc(item.plate) + "</strong></li>" +
              "<li><span>Motorista</span><strong>" + BillingUI.esc(item.driver) + "</strong></li>" +
              "<li><span>Produto</span><strong>" + BillingUI.esc(item.product) + " (" + Number(item.quantity).toLocaleString("pt-BR") + " L × " + BillingStore.formatMoney(item.unit_price) + ")</strong></li>" +
              "</ul>" +
              '<div style="display:flex;gap:8px;margin-bottom:12px">' +
              '<button type="button" class="tw-dw-btn tw-dw-btn-sm tw-dw-btn-outline btn-nfe-print"><i class="fa fa-print"></i> Imprimir DANFE (POC)</button>' +
              '<button type="button" class="tw-dw-btn tw-dw-btn-sm tw-dw-btn-outline btn-nfe-xml-toggle"><i class="fa fa-code"></i> Visualizar XML</button>' +
              "</div>" +
              '<pre id="nfe-xml-block" style="display:none;background:#1e293b;color:#e2e8f0;padding:14px;border-radius:8px;font-size:11px;overflow:auto;max-height:260px">' + xmlEscaped + "</pre>";
            BillingUI.openModal(
              "NF-e " + item.nfe_number + " / Série " + item.nfe_series,
              bodyHtml,
              function () { setTimeout(function () { openDetailModal(cycleId, { tab: "nfe" }); }, 300); },
              { size: "lg", saveLabel: "Voltar às notas" }
            );
            setTimeout(function () {
              var xmlToggle = document.querySelector(".btn-nfe-xml-toggle");
              if (xmlToggle) {
                xmlToggle.onclick = function () {
                  var block = document.getElementById("nfe-xml-block");
                  if (!block) return;
                  var hidden = block.style.display === "none";
                  block.style.display = hidden ? "block" : "none";
                  xmlToggle.innerHTML = hidden ? '<i class="fa fa-eye-slash"></i> Ocultar XML' : '<i class="fa fa-code"></i> Visualizar XML';
                };
              }
              var printBtn = document.querySelector(".btn-nfe-print");
              if (printBtn) {
                printBtn.onclick = function () {
                  var comp = BillingStore.companyById(c.company_id);
                  var win = window.open("", "_blank", "width=700,height=800");
                  win.document.write(
                    '<!DOCTYPE html><html><head><title>DANFE POC — NF-e ' + item.nfe_number + '</title>' +
                    '<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}' +
                    'h2{color:#1e3a8a;border-bottom:2px solid #1e3a8a;padding-bottom:6px}' +
                    'table{width:100%;border-collapse:collapse;font-size:12px}' +
                    'td,th{border:1px solid #ccc;padding:6px 8px}th{background:#f1f5f9}' +
                    '.warn{background:#fef3c7;border:1px solid #f59e0b;padding:8px 12px;margin-bottom:16px;font-size:12px;border-radius:4px}' +
                    '</style></head><body>' +
                    '<div class="warn">⚠️ DOCUMENTO DE USO INTERNO — POC DE DEMONSTRAÇÃO. Não tem validade fiscal.</div>' +
                    '<h2>DANFE — NF-e ' + item.nfe_number + '</h2>' +
                    '<table><tr><th>Chave NF-e</th><td colspan="3">' + item.nfe_key + '</td></tr>' +
                    '<tr><th>Série</th><td>' + item.nfe_series + '</td><th>Data emissão</th><td>' + BillingStore.formatDate(item.issue_date) + '</td></tr>' +
                    '<tr><th>Empresa</th><td colspan="3">' + (comp ? comp.name + ' — ' + comp.cnpj : '—') + '</td></tr>' +
                    '<tr><th>Placa</th><td>' + item.plate + '</td><th>Motorista</th><td>' + item.driver + '</td></tr>' +
                    '<tr><th>Produto</th><td>' + item.product + '</td><th>Quantidade</th><td>' + Number(item.quantity).toLocaleString("pt-BR") + ' L</td></tr>' +
                    '<tr><th>Preço unitário</th><td>' + BillingStore.formatMoney(item.unit_price) + '</td><th>Total</th><td>' + BillingStore.formatMoney(item.gross_amount) + '</td></tr>' +
                    "</table></body></html>"
                  );
                  win.document.close();
                  win.focus();
                  setTimeout(function () { win.print(); }, 400);
                };
              }
            }, 150);
          };
        });

        container.querySelectorAll(".btn-remove-item").forEach(function (b) {
          b.onclick = function () {
            if (!confirm("Remover esta nota do faturamento? A remoção é lógica e fica registrada no histórico.")) return;
            var d = BillingStore.getData();
            var item = d.cycle_items.filter(function (x) { return x.id === b.dataset.id; })[0];
            var cy = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
            if (!item || !cy || !BillingStore.isOpenCycleStatus(cy.status)) {
              BillingUI.toast("Não é permitido remover notas de faturamento fechado.", "error");
              return;
            }
            item.status = "removed";
            item.removed_at = nowIso();
            item.removed_by = "Admin";
            BillingStore.recalculateCycleFromItems(d, cycleId);
            addHistory(d, cycleId, "item_removed", "NF-e " + item.nfe_number + " removida (remoção lógica)");
            BillingStore.setData(d);
            render();
            openDetailModal(cycleId, { tab: "nfe" });
            BillingUI.toast("Nota removida e totais recalculados.", "success");
          };
        });

        var addBtn = container.querySelector(".btn-add-item");
        if (addBtn) {
          addBtn.onclick = function () {
            BillingUI.openModal(
              "Adicionar nota ao faturamento",
              '<div class="row">' +
              '<div class="col-md-4"><div class="form-group"><label>Número da NF-e *</label><input type="text" class="form-control" id="ni_number"></div></div>' +
              '<div class="col-md-4"><div class="form-group"><label>Data de emissão *</label><input type="date" class="form-control" id="ni_date"></div></div>' +
              '<div class="col-md-4"><div class="form-group"><label>Placa</label><input type="text" class="form-control" id="ni_plate" placeholder="AAA-0X00"></div></div>' +
              '<div class="col-md-4"><div class="form-group"><label>Produto</label><input type="text" class="form-control" id="ni_product" value="Diesel S10"></div></div>' +
              '<div class="col-md-4"><div class="form-group"><label>Quantidade (L) *</label><input type="number" min="0" step="0.01" class="form-control" id="ni_qty"></div></div>' +
              '<div class="col-md-4"><div class="form-group"><label>Preço unitário (R$) *</label><input type="number" min="0" step="0.01" class="form-control" id="ni_price"></div></div>' +
              "</div>",
              function () {
                var g = function (id) { return document.getElementById(id).value; };
                var qty = Number(g("ni_qty")), price = Number(g("ni_price"));
                if (!g("ni_number").trim()) { BillingUI.toast("Número da nota é obrigatório.", "error"); return false; }
                if (!g("ni_date")) { BillingUI.toast("Data de emissão é obrigatória.", "error"); return false; }
                if (!(qty > 0) || !(price > 0)) { BillingUI.toast("Quantidade e preço devem ser positivos.", "error"); return false; }
                var d = BillingStore.getData();
                var cy = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
                if (!cy || !BillingStore.isOpenCycleStatus(cy.status)) {
                  BillingUI.toast("Não é permitido adicionar notas em faturamento fechado.", "error");
                  return false;
                }
                var gross = Math.round(qty * price * 100) / 100;
                d.cycle_items.push({
                  id: BillingStore.uid("ci"),
                  cycle_id: cycleId,
                  nfe_number: g("ni_number").trim(),
                  nfe_series: "1",
                  nfe_key: "3526" + String(Date.now()).slice(-40).padStart(40, "0"),
                  issue_date: g("ni_date"),
                  plate: g("ni_plate") || "—",
                  driver: "—",
                  product: g("ni_product") || "—",
                  quantity: qty,
                  unit_price: price,
                  gross_amount: gross,
                  net_amount: gross,
                  status: "active",
                  manually_added: true,
                  added_by: "Admin",
                  removed_at: null,
                  removed_by: null
                });
                BillingStore.recalculateCycleFromItems(d, cycleId);
                addHistory(d, cycleId, "item_added", "NF-e " + g("ni_number").trim() + " adicionada manualmente");
                BillingStore.setData(d);
                render();
                setTimeout(function () { openDetailModal(cycleId, { tab: "nfe" }); }, 300);
                BillingUI.toast("Nota adicionada e totais recalculados.", "success");
              },
              { size: "lg", saveLabel: "Adicionar nota" }
            );
          };
        }

        var ruleDiscBtn = container.querySelector(".btn-apply-rule-discount");
        if (ruleDiscBtn) {
          ruleDiscBtn.onclick = function () {
            var discInput = document.getElementById("cy-discount-input");
            if (discInput) discInput.value = ruleDiscBtn.dataset.val;
            BillingUI.toast("Desconto calculado preenchido. Informe a justificativa e clique em Aplicar ajustes.", "warn");
          };
        }

        var applyBtn = container.querySelector(".btn-apply-adjustments");
        if (applyBtn) {
          applyBtn.onclick = function () {
            var disc = Number(document.getElementById("cy-discount-input").value || 0);
            var incr = Number(document.getElementById("cy-increase-input").value || 0);
            var note = (document.getElementById("cy-adjust-note").value || "").trim();
            if (disc < 0 || incr < 0) { BillingUI.toast("Valores de ajuste não podem ser negativos.", "error"); return; }
            if (!note) { BillingUI.toast("Justificativa é obrigatória para ajuste manual.", "error"); return; }
            var d = BillingStore.getData();
            var cy = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
            if (!cy || !BillingStore.isOpenCycleStatus(cy.status)) {
              BillingUI.toast("Reabra a fatura antes de aplicar ajustes.", "error");
              return;
            }
            if (disc > Number(cy.gross_amount)) { BillingUI.toast("Desconto não pode exceder o valor bruto.", "error"); return; }
            cy.discount_amount = disc;
            cy.increase_amount = incr;
            cy.manual_adjustment_note = note;
            cy.adjusted_by = "Admin";
            cy.adjusted_at = nowIso();
            BillingStore.recalculateNet(cy);
            addHistory(d, cycleId, "adjustment", "Desconto " + BillingStore.formatMoney(disc) + " / Acréscimo " + BillingStore.formatMoney(incr) + ' — "' + note + '"');
            BillingStore.setData(d);
            render();
            openDetailModal(cycleId, { tab: "ajustes" });
            BillingUI.toast("Ajustes aplicados e total recalculado.", "success");
          };
        }
      }, 150);
    }

    function sendCycle(cycleId) {
      var d = BillingStore.getData();
      var cy = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
      if (!cy) return;
      if (!BillingStore.cycleCanBeSent(cy)) { BillingUI.toast("Apenas faturas fechadas podem ser enviadas.", "error"); return; }
      var comp = BillingStore.companyById(cy.company_id);
      var emailTo = comp ? comp.email : null;
      if (!emailTo || emailTo.indexOf("@") < 0) {
        BillingUI.toast("Empresa sem e-mail válido. Envio bloqueado.", "error");
        return;
      }
      if (!cy.portal_link) {
        BillingUI.toast("Link do portal inexistente. Envio bloqueado.", "error");
        return;
      }
      var isResend = !!cy.sent_at;
      if (!confirm((isResend ? "Reenviar" : "Enviar") + " fatura para " + emailTo + "?\nO e-mail contém o link do portal. As notas não são anexadas ao e-mail.")) return;
      var now = nowIso();
      d.send_logs.push({
        id: BillingStore.uid("sl"),
        cycle_id: cy.id,
        email_to: emailTo,
        subject: "Fatura " + (cy.billing_code || cy.id) + " — " + BillingStore.formatDateRange(cy.reference_start, cy.reference_end),
        portal_link: cy.portal_link,
        sent_at: now,
        status: "success",
        sent_by: "Admin",
        error_message: null
      });
      if (!isResend) {
        cy.sent_at = now;
        cy.status = "sent";
        addHistory(d, cy.id, "sent", "E-mail enviado para " + emailTo + " com link do portal");
      } else {
        cy.status = "resent";
        addHistory(d, cy.id, "resent", "E-mail reenviado para " + emailTo);
      }
      cy.last_sent_at = now;
      BillingStore.setData(d);
      render();
      BillingUI.toast((isResend ? "Reenvio" : "Envio") + " registrado com sucesso (simulado).", "success");
    }

    function closeAndSendCycle(cycleId) {
      var d = BillingStore.getData();
      var cy = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
      if (!cy || !BillingStore.isOpenCycleStatus(cy.status)) {
        BillingUI.toast("Apenas faturamentos em aberto podem ser fechados.", "error");
        return;
      }
      if (!(cy.invoice_count > 0)) {
        BillingUI.toast("Faturamento sem notas não pode ser fechado.", "error");
        return;
      }
      var comp = BillingStore.companyById(cy.company_id);
      var emailTo = comp ? comp.email : null;
      if (!emailTo || emailTo.indexOf("@") < 0) {
        BillingUI.toast("Empresa sem e-mail válido. Cadastre o e-mail antes de fechar.", "error");
        return;
      }
      var today = new Date().toISOString().slice(0, 10);
      var earlyClose = cy.reference_end > today;
      var msg = "Fechar e enviar fatura " + (cy.billing_code || "") + " para " + emailTo + "?";
      if (earlyClose) {
        msg += "\n\nATENÇÃO: O período deste faturamento vai até " + BillingStore.formatDate(cy.reference_end) + ".\nAs vendas realizadas após o fechamento serão incorporadas ao próximo faturamento.";
      }
      if (!confirm(msg)) return;
      var now = nowIso();
      cy.closed_at = now;
      cy.boleto_id = "BLT-" + String(Date.now()).slice(-4);
      cy.portal_link = "https://portal.demo.ecomercial/" + comp.id + "/fat-" + cy.reference_start.slice(0, 7);
      cy.sent_at = now;
      cy.last_sent_at = now;
      cy.status = "sent";
      d.send_logs.push({
        id: BillingStore.uid("sl"),
        cycle_id: cy.id,
        email_to: emailTo,
        subject: "Fatura " + (cy.billing_code || cy.id) + " — " + BillingStore.formatDateRange(cy.reference_start, cy.reference_end),
        portal_link: cy.portal_link,
        sent_at: now,
        status: "success",
        sent_by: "Admin",
        error_message: null
      });
      var detail = "Fatura fechada e enviada para " + emailTo;
      if (earlyClose) detail += " (fechamento antecipado — período encerrava em " + BillingStore.formatDate(cy.reference_end) + ")";
      addHistory(d, cy.id, "closed", detail.replace("fechada e enviada", "fechada"));
      addHistory(d, cy.id, "sent",   "E-mail enviado para " + emailTo + " com link do portal" + (earlyClose ? " (antecipado)" : ""));
      BillingStore.setData(BillingStore.syncOpenCycles(d));
      render();
      BillingUI.toast("Fatura fechada e enviada para " + emailTo + ".", "success");
    }

    function openAdvanceModal(cycleId) {
      var d = BillingStore.getData();
      var cy = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
      if (!cy) return;
      var comp = BillingStore.companyById(cy.company_id);
      var compName = comp ? comp.name : cy.company_id;
      var existingAdvs = BillingStore.advancesForCycle(cy.id);
      var totalAdv = existingAdvs.reduce(function (s, a) { return s + Number(a.amount); }, 0);
      var bodyHtml = [
        '<div style="margin-bottom:12px">',
        '<strong>Fatura:</strong> ' + BillingUI.esc(cy.billing_code || cy.id) + ' &nbsp;|&nbsp; <strong>Empresa:</strong> ' + BillingUI.esc(compName),
        '<br><strong>Valor da fatura:</strong> ' + BillingStore.formatMoney(cy.net_amount),
        totalAdv > 0 ? ' &nbsp;|&nbsp; <strong>Total adiantado:</strong> ' + BillingStore.formatMoney(totalAdv) : '',
        '</div>',
        '<div class="form-group"><label>Valor do adiantamento (R$) <span class="text-danger">*</span></label>',
        '<input type="number" id="adv-amount" class="form-control" min="0.01" step="0.01" placeholder="Ex: 5000.00" required></div>',
        '<div class="form-group"><label>Justificativa / Observação <span class="text-danger">*</span></label>',
        '<textarea id="adv-note" class="form-control" rows="3" placeholder="Informe o motivo do adiantamento..." required></textarea></div>',
        '<div class="alert alert-info" style="font-size:12px;margin-bottom:0">',
        '<i class="fa fa-info-circle"></i> O adiantamento será registrado no histórico da fatura e poderá ser consultado a qualquer momento na aba <strong>Adiantamentos</strong> dos detalhes.',
        '</div>'
      ].join("");
      $("#modal-generic .modal-title").text("Antecipar faturamento — " + (cy.billing_code || cy.id));
      $("#modal-generic .modal-body").html(bodyHtml);
      $("#modal-generic .modal-footer").html(
        '<button type="button" class="btn btn-default" data-dismiss="modal">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" id="btn-confirm-advance" data-cycle="' + cycleId + '">Registrar adiantamento</button>'
      );
      $("#modal-generic").modal("show");
      $("#btn-confirm-advance").off("click").on("click", function () {
        var amount = parseFloat($("#adv-amount").val());
        var note   = $("#adv-note").val().trim();
        if (!amount || amount <= 0) { BillingUI.toast("Informe um valor válido.", "error"); return; }
        if (!note) { BillingUI.toast("Informe a justificativa.", "error"); return; }
        var dd = BillingStore.getData();
        if (!dd.cycle_advances) dd.cycle_advances = [];
        var newAdv = {
          id: BillingStore.uid("adv"),
          cycle_id: cycleId,
          amount: amount,
          note: note,
          registered_by: "Admin",
          registered_at: nowIso()
        };
        dd.cycle_advances.push(newAdv);
        addHistory(dd, cycleId, "advance", "Adiantamento de " + BillingStore.formatMoney(amount) + " registrado. Justificativa: " + note);
        BillingStore.setData(dd);
        $("#modal-generic").modal("hide");
        BillingUI.toast("Adiantamento de " + BillingStore.formatMoney(amount) + " registrado com sucesso.", "success");
      });
    }

    function markAsPaid(cycleId) {
      var d = BillingStore.getData();
      var cy = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
      if (!cy) return;
      var allowed = ["closed", "sent", "resent", "overdue"];
      if (allowed.indexOf(cy.status) < 0) {
        BillingUI.toast("Apenas faturas fechadas (pendentes) podem ser marcadas como pagas.", "error");
        return;
      }
      if (!confirm("Marcar esta fatura como Pago / Finalizado?")) return;
      cy.status = "paid";
      addHistory(d, cy.id, "paid", "Fatura marcada como Pago / Finalizado");
      BillingStore.setData(d);
      render();
      BillingUI.toast("Fatura marcada como Pago / Finalizado.", "success");
    }

    function reopenCycle(cycleId) {
      var d = BillingStore.getData();
      var cy = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
      if (!cy) return;
      if (!BillingStore.isClosedGroupStatus(cy.status)) {
        BillingUI.toast("Apenas faturas fechadas podem ser reabertas.", "error");
        return;
      }
      var prevStatus = cy.status;
      if (!confirm(
        "Reabrir a fatura " + (cy.billing_code || cy.id) + "?\n\n" +
        "A fatura voltará para Em aberto, permitindo edição de notas, ajustes e descontos.\n" +
        "Após os ajustes, utilize Fechar e enviar para reenviá-la ao cliente."
      )) return;
      cy.status = "open";
      cy.closed_at = null;
      cy.sent_at = null;
      cy.last_sent_at = null;
      cy.boleto_id = null;
      cy.portal_link = "";
      addHistory(d, cy.id, "created", "Fatura reaberta (estava " + prevStatus + ") — ajustes e reenvio pendentes");
      BillingStore.setData(d);
      jQuery(".poc_modal").modal("hide");
      render();
      BillingUI.toast("Fatura reaberta. Faça os ajustes necessários e use Fechar e enviar.", "warn");
    }

    function populateFilters() {
      var d = BillingStore.getData();
      var fill = function (id, items, label) {
        var el = document.getElementById(id);
        if (!el) return;
        var current = el.value;
        el.innerHTML = '<option value="">Todos</option>' + items.map(function (x) {
          return '<option value="' + x.id + '">' + BillingUI.esc(label(x)) + "</option>";
        }).join("");
        el.value = current;
      };
      fill("flt-c-company", d.companies, function (x) { return x.name; });
      fill("flt-c-fleet",   d.fleets,    function (x) { return x.name; });
      fill("flt-c-config",  d.configurations.filter(function (x) { return x.status === "active"; }), function (x) { return x.name; });
    }

    function refreshStatusFilter() {
      var el = document.getElementById("flt-c-status");
      if (!el) return;
      var opts = currentTab === "open"
        ? [["open", "Em aberto"], ["in_review", "Em conferência"]]
        : [["closed", "Fechado — Aguard. envio"], ["sent", "Enviado — Aguard. pagamento"], ["resent", "Reenviado — Aguard. pagamento"], ["paid", "Pago / Finalizado"], ["overdue", "Vencido"]];
      el.innerHTML = '<option value="">Todos</option>' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
    }

    document.querySelectorAll(".bill-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".bill-tab-btn").forEach(function (b) { b.classList.remove("bill-tab-active"); });
        btn.classList.add("bill-tab-active");
        currentTab = btn.dataset.tab;
        refreshStatusFilter();
        render();
      });
    });

    document.addEventListener("click", function (e) {
      var t = e.target;
      var detail = t.closest(".btn-detail-cycle");
      if (detail) { e.preventDefault(); openDetailModal(detail.dataset.id); return; }
      var closeSend = t.closest(".btn-close-send-cycle");
      if (closeSend) { e.preventDefault(); jQuery(".poc_modal").modal("hide"); closeAndSendCycle(closeSend.dataset.id); return; }
      var send = t.closest(".btn-send-cycle");
      if (send) { e.preventDefault(); sendCycle(send.dataset.id); return; }
      var advance = t.closest(".btn-advance-cycle");
      if (advance) { e.preventDefault(); jQuery(".poc_modal").modal("hide"); openAdvanceModal(advance.dataset.id); return; }
      var paid = t.closest(".btn-paid-cycle");
      if (paid) { e.preventDefault(); markAsPaid(paid.dataset.id); return; }
      var reopen = t.closest(".btn-reopen-cycle");
      if (reopen) { e.preventDefault(); jQuery(".poc_modal").modal("hide"); reopenCycle(reopen.dataset.id); return; }
    });

    ["flt-c-company", "flt-c-fleet", "flt-c-config", "flt-c-status", "flt-c-due", "flt-c-min", "flt-c-max", "flt-c-sent"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", render);
        el.addEventListener("input", render);
      }
    });

    populateFilters();
    refreshStatusFilter();
    render();
    BillingUI.bindSearch("search-cycles", "tbody-cycles");
  }
};
