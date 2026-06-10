var BillingUI = (function () {
  function toast(msg, type) {
    var el = document.getElementById("poc-toast");
    if (!el) return;
    var cls = type === "error" ? "alert-danger" : type === "warn" ? "alert-warning" : "alert-success";
    el.innerHTML = '<div class="alert ' + cls + ' alert-dismissible"><button type="button" class="close" data-dismiss="alert">&times;</button>' + msg + "</div>";
    setTimeout(function () { el.innerHTML = ""; }, 4000);
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
    return active === "active" || active === true
      ? '<span class="label label-success">Ativo</span>'
      : '<span class="label label-default">Inativo</span>';
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

  return { toast: toast, esc: esc, openModal: openModal, statusLabel: statusLabel, bindSearch: bindSearch };
})();

var BillingPages = {
  inicio: function () {
    function render() {
      var d = BillingStore.syncOpenCycles(BillingStore.getData());
      BillingStore.setData(d);
      var rows = [];
      var activeLinks = BillingStore.activeLinks();
      var openCycles = d.cycles.filter(function (c) { return BillingStore.isOpenCycleStatus(c.status); });
      rows.push("<tr><td><span class=\"label label-default\">Regra</span></td><td><strong>Vínculos ativos × Faturamentos em aberto</strong></td><td>1 faturamento por vínculo/cliente no período</td><td>" + activeLinks.length + " / " + openCycles.length + "</td><td>" + (activeLinks.length === openCycles.length ? '<span class="label label-success">Consistente</span>' : '<span class="label label-warning">Divergente</span>') + "</td></tr>");
      d.configurations.forEach(function (c) {
        var links = BillingStore.linksForConfig(c.id).filter(BillingStore.linkIsActive);
        rows.push("<tr><td><span class=\"label label-primary\">Configuração</span></td><td>" + BillingUI.esc(c.name) + "</td><td>" + BillingLabels.billingType(c.billing_type) + "</td><td>" + links.length + " vínculo(s) ativo(s)</td><td>" + BillingUI.statusLabel(c.status) + "</td></tr>");
      });
      openCycles.forEach(function (cy) {
        var cust = BillingStore.customerById(cy.customer_id);
        var fleet = BillingStore.fleetById(cy.fleet_id);
        rows.push("<tr><td><span class=\"label label-info\">Em aberto</span></td><td>" + (cust ? cust.name : "—") + "</td><td>" + (fleet ? fleet.name : "—") + " · " + BillingStore.formatDateRange(cy.reference_start, cy.reference_end) + "</td><td>" + cy.invoice_count + " NF-e</td><td>" + BillingStore.formatMoney(cy.net_amount) + "</td></tr>");
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
        return (
          '<tr class="bill-expand-row" data-expand-for="' + cfg.id + '"><td colspan="13">' +
          '<div class="bill-expand-panel">' + head +
          '<div class="bill-expand-empty"><p>Nenhuma empresa vinculada a esta configuração.</p>' +
          addLinkBtn(cfg.id, "Adicionar empresa / frota") +
          "</div></div></td></tr>"
        );
      }
      var rows = links.map(function (l) {
        var emp = BillingStore.companyById(l.company_id);
        var cust = BillingStore.customerById(l.customer_id);
        var fleet = BillingStore.fleetById(l.fleet_id);
        var adj = l.specific_adjustment_type !== "none" && l.specific_adjustment_value
          ? BillingLabels.adjustment(l.specific_adjustment_type, "percentage", l.specific_adjustment_value)
          : "—";
        return (
          "<tr><td>" + (emp ? emp.name : "—") + "</td><td><code>" + (emp ? emp.cnpj : "—") + "</code></td>" +
          "<td>" + (cust ? cust.name : "—") + "</td>" +
          "<td>" + (fleet ? fleet.name : "—") + "</td>" +
          "<td>" + BillingLabels.creditLimit(l.specific_credit_limit) + "</td>" +
          "<td>" + adj + "</td>" +
          "<td>" + BillingUI.statusLabel(l.status) + "</td>" +
          "<td><small>" + BillingStore.formatDateRange(l.valid_from, l.valid_until) + "</small></td>" +
          '<td class="bill-col-actions">' +
          '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline tw-dw-btn-primary btn-edit-link" data-link-id="' + l.id + '" data-config-id="' + cfg.id + '">Editar</button> ' +
          '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline tw-dw-btn-error btn-rm-link" data-link-id="' + l.id + '" data-config-id="' + cfg.id + '">Remover</button>' +
          "</td></tr>"
        );
      }).join("");
      return (
        '<tr class="bill-expand-row" data-expand-for="' + cfg.id + '"><td colspan="13">' +
        '<div class="bill-expand-panel">' + head +
        '<div class="table-responsive"><table class="table table-bordered table-condensed bill-subtable">' +
        "<thead><tr><th>Empresa</th><th>CNPJ</th><th>Cliente</th><th>Centro de cobrança (frota)</th><th>Limite de crédito</th><th>Desconto/Acréscimo</th><th>Status</th><th>Vigência</th><th>Ação</th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table></div></div></td></tr>"
      );
    }

    function render() {
      var d = BillingStore.getData();
      var tbody = document.getElementById("tbody-configs");
      if (!tbody) return;
      var html = "";
      d.configurations.forEach(function (c) {
        var isOpen = expanded[c.id];
        html +=
          '<tr class="bill-main-row' + (isOpen ? " is-expanded" : "") + '" data-id="' + c.id + '">' +
          expandBtnHtml(c.id, isOpen) +
          '<td class="bill-col-actions">' +
          '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline tw-dw-btn-primary btn-edit-cfg" data-id="' + c.id + '">Editar</button> ' +
          '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline btn-link-cfg" data-id="' + c.id + '">Vincular</button>' +
          "</td>" +
          '<td><strong>' + BillingUI.esc(c.name) + '</strong><br><small class="text-muted">' + BillingUI.esc(c.subtitle || "") + "</small></td>" +
          "<td>" + BillingLabels.billingType(c.billing_type) + "</td>" +
          "<td>" + BillingLabels.chargeType(c.charge_type) + "</td>" +
          "<td>" + BillingLabels.billingPeriod(c.billing_period) + "</td>" +
          "<td>" + BillingLabels.adjustment(c.adjustment_type, c.adjustment_mode, c.adjustment_value) + "</td>" +
          "<td>" + BillingLabels.creditLimit(c.credit_limit) + "</td>" +
          "<td><small>" + BillingStore.formatDateRange(c.valid_from, c.valid_until) + "</small></td>" +
          "<td class=\"text-center\" title=\"Empresas distintas nos vínculos\"><span class=\"label label-default\">" + BillingStore.countDistinctCompanies(c.id) + "</span></td>" +
          "<td class=\"text-center\" title=\"Frotas distintas nos vínculos (cada frota pertence a uma empresa)\"><span class=\"label label-default\">" + BillingStore.countDistinctFleets(c.id) + "</span></td>" +
          "<td>" + BillingUI.statusLabel(c.status) + "</td>" +
          '<td class="bill-col-menu"><div class="dropdown">' +
          '<button class="bill-kebab" data-toggle="dropdown"><i class="fa fa-ellipsis-v"></i></button>' +
          '<ul class="dropdown-menu dropdown-menu-right">' +
          '<li><a href="#" class="btn-edit-cfg" data-id="' + c.id + '"><i class="fa fa-pencil"></i> Editar</a></li>' +
          '<li><a href="#" class="btn-link-cfg" data-id="' + c.id + '"><i class="fa fa-link"></i> Vincular empresa/frota</a></li>' +
          '<li><a href="#" class="btn-toggle-cfg" data-id="' + c.id + '"><i class="fa fa-power-off"></i> Ativar/Inativar</a></li>' +
          "</ul></div></td></tr>";
        if (isOpen) html += renderExpandRow(c);
      });
      tbody.innerHTML = html;
      var n = d.configurations.length;
      var info = document.getElementById("config-count-info");
      if (info) info.textContent = n ? "Mostrando 1 a " + n + " de " + n + " registros" : "";
      bindRowActions();
    }

    function toggleExpandRow(configId) {
      expanded[configId] = !expanded[configId];
      var mainRow = document.querySelector('.bill-main-row[data-id="' + configId + '"]');
      if (!mainRow) {
        render();
        return;
      }
      var btn = mainRow.querySelector(".bill-expand-btn");
      var detailRow = document.querySelector('.bill-expand-row[data-expand-for="' + configId + '"]');
      if (expanded[configId]) {
        mainRow.classList.add("is-expanded");
        if (btn) {
          btn.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
        if (!detailRow) {
          var cfg = BillingStore.configById(configId);
          if (cfg) {
            var wrap = document.createElement("tbody");
            wrap.innerHTML = renderExpandRow(cfg);
            var newRow = wrap.firstElementChild;
            if (newRow) {
              mainRow.insertAdjacentElement("afterend", newRow);
              bindRowActions();
            }
          }
        }
      } else {
        mainRow.classList.remove("is-expanded");
        if (btn) {
          btn.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
        }
        if (detailRow) detailRow.remove();
      }
    }

    function bindRowActions() {
      document.querySelectorAll(".bill-expand-btn").forEach(function (btn) {
        btn.onclick = function () {
          toggleExpandRow(btn.getAttribute("data-id"));
        };
      });
      document.querySelectorAll(".btn-edit-cfg").forEach(function (btn) {
        btn.onclick = function (e) {
          e.preventDefault();
          openConfigModal(BillingStore.configById(btn.getAttribute("data-id")));
        };
      });
      document.querySelectorAll(".btn-link-cfg, .btn-add-link").forEach(function (btn) {
        btn.onclick = function (e) {
          e.preventDefault();
          var configId = btn.getAttribute("data-id") || btn.getAttribute("data-config-id");
          openLinkModal(configId, null);
        };
      });
      document.querySelectorAll(".btn-edit-link").forEach(function (btn) {
        btn.onclick = function (e) {
          e.preventDefault();
          openLinkModal(btn.getAttribute("data-config-id"), BillingStore.linkById(btn.getAttribute("data-link-id")));
        };
      });
      document.querySelectorAll(".btn-rm-link").forEach(function (btn) {
        btn.onclick = function (e) {
          e.preventDefault();
          if (!confirm("Remover este vínculo empresa/frota?")) return;
          var linkId = btn.getAttribute("data-link-id");
          var configId = btn.getAttribute("data-config-id");
          var d = BillingStore.getData();
          d.links = d.links.filter(function (x) { return x.id !== linkId; });
          d = BillingStore.removeOpenCyclesForLink(d, linkId);
          BillingStore.setData(d);
          expanded[configId] = true;
          render();
          BillingUI.toast("Vínculo removido.", "success");
        };
      });
      document.querySelectorAll(".btn-toggle-cfg").forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          var d = BillingStore.getData();
          var c = d.configurations.filter(function (x) { return x.id === a.getAttribute("data-id"); })[0];
          if (c) {
            c.status = c.status === "active" ? "inactive" : "active";
            BillingStore.setData(d);
            render();
            BillingUI.toast("Status atualizado.", "success");
          }
        };
      });
    }

    function sel(val, current) {
      return val === current ? " selected" : "";
    }

    function configFormHtml(c) {
      c = c || { billing_type: "period", charge_type: "only_invoiced", billing_period: "monthly", adjustment_type: "none", adjustment_mode: "percentage", status: "active" };
      var e = BillingUI.esc;
      var periodOpts = ["monthly", "biweekly", "weekly", "daily"].map(function (p) {
        return '<option value="' + p + '"' + sel(p, c.billing_period) + ">" + BillingLabels.billingPeriod(p) + "</option>";
      }).join("");
      return (
        '<div class="row">' +
        '<div class="col-sm-6"><div class="form-group"><label>Nome do faturamento *</label><input class="form-control" id="cf_name" value="' + e(c.name) + '" required></div></div>' +
        '<div class="col-sm-6"><div class="form-group"><label>Descrição</label><input class="form-control" id="cf_sub" value="' + e(c.subtitle) + '"></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Tipo *</label><select class="form-control" id="cf_btype">' +
        '<option value="period"' + sel("period", c.billing_type) + '>Período</option>' +
        '<option value="prepaid"' + sel("prepaid", c.billing_type) + '>Pré-pago</option></select></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Tipo de cobrança *</label><select class="form-control" id="cf_ctype">' +
        '<option value="only_invoiced"' + sel("only_invoiced", c.charge_type) + '>Apenas vendas faturadas</option>' +
        '<option value="invoiced_and_immediate"' + sel("invoiced_and_immediate", c.charge_type) + '>Faturadas + Imediata</option>' +
        '<option value="immediate"' + sel("immediate", c.charge_type) + '>Imediata</option></select></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Período de cobrança *</label><select class="form-control" id="cf_period">' + periodOpts + "</select></div></div>" +
        '<div class="col-sm-4"><div class="form-group"><label>Ajuste padrão</label><select class="form-control" id="cf_adjtype">' +
        '<option value="none"' + sel("none", c.adjustment_type) + '>Nenhum</option>' +
        '<option value="discount"' + sel("discount", c.adjustment_type) + '>Desconto</option>' +
        '<option value="increase"' + sel("increase", c.adjustment_type) + '>Acréscimo</option></select></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Valor do ajuste (%)</label><input type="number" step="0.01" class="form-control" id="cf_adjval" value="' + (c.adjustment_value || 0) + '"></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Limite de crédito padrão (R$)</label><input type="number" class="form-control" id="cf_limit" value="' + (c.credit_limit || "") + '" placeholder="Não aplicável"></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Vigência inicial *</label><input type="date" class="form-control" id="cf_vfrom" value="' + e(c.valid_from || "2026-01-01") + '"></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Vigência final *</label><input type="date" class="form-control" id="cf_vuntil" value="' + e(c.valid_until || "2026-12-31") + '"></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Status *</label><select class="form-control" id="cf_status">' +
        '<option value="active"' + sel("active", c.status) + '>Ativo</option>' +
        '<option value="inactive"' + sel("inactive", c.status) + '>Inativo</option></select></div></div>' +
        '<div class="col-sm-12"><div class="form-group"><label>Observações</label><textarea class="form-control" id="cf_notes" rows="2">' + e(c.notes) + "</textarea></div></div></div>"
      );
    }

    function openConfigModal(c) {
      var isEdit = !!c;
      BillingUI.openModal(isEdit ? "Editar configuração" : "Nova configuração de faturamento", configFormHtml(c), function () {
        var name = document.getElementById("cf_name").value.trim();
        if (!name) { BillingUI.toast("Informe o nome.", "error"); return false; }
        var d = BillingStore.getData();
        var item = {
          id: c ? c.id : BillingStore.uid("cfg"),
          name: name,
          subtitle: document.getElementById("cf_sub").value.trim(),
          billing_type: document.getElementById("cf_btype").value,
          charge_type: document.getElementById("cf_ctype").value,
          billing_period: document.getElementById("cf_period").value,
          adjustment_type: document.getElementById("cf_adjtype").value,
          adjustment_mode: "percentage",
          adjustment_value: parseFloat(document.getElementById("cf_adjval").value) || 0,
          credit_limit: document.getElementById("cf_limit").value ? parseFloat(document.getElementById("cf_limit").value) : null,
          valid_from: document.getElementById("cf_vfrom").value,
          valid_until: document.getElementById("cf_vuntil").value,
          status: document.getElementById("cf_status").value,
          notes: document.getElementById("cf_notes").value.trim()
        };
        if (c) d.configurations = d.configurations.map(function (x) { return x.id === c.id ? item : x; });
        else d.configurations.push(item);
        BillingStore.setData(d);
        render();
        BillingUI.toast("Configuração salva.", "success");
        return true;
      }, { size: "lg" });
    }

    function fleetOptionsHtml(companyId, selectedFleetId) {
      var fleets = companyId ? BillingStore.fleetsForCompany(companyId) : [];
      return '<option value="">Selecione...</option>' + fleets.map(function (x) {
        return '<option value="' + x.id + '"' + sel(x.id, selectedFleetId) + ">" + x.name + " (" + x.cost_center + ")</option>";
      }).join("");
    }

    function bindLinkModalFleetFilter(selectedFleetId) {
      var companySel = document.getElementById("lk_company");
      var fleetSel = document.getElementById("lk_fleet");
      if (!companySel || !fleetSel) return;
      function refresh() {
        var companyId = companySel.value;
        fleetSel.disabled = !companyId;
        fleetSel.innerHTML = companyId
          ? fleetOptionsHtml(companyId, selectedFleetId)
          : '<option value="">Selecione a empresa primeiro...</option>';
        if (selectedFleetId && companyId) fleetSel.value = selectedFleetId;
      }
      companySel.onchange = function () { selectedFleetId = ""; refresh(); };
      refresh();
    }

    function openLinkModal(configId, existing) {
      var d = BillingStore.getData();
      var lk = existing || {};
      var opts = function (arr, idKey, labelFn, selectedId) {
        return arr.map(function (x) {
          return '<option value="' + x[idKey] + '"' + sel(x[idKey], selectedId) + ">" + labelFn(x) + "</option>";
        }).join("");
      };
      var html =
        '<div class="row">' +
        '<div class="col-sm-12"><p class="text-muted tw-text-sm">Cada vínculo associa um <strong>cliente</strong> a uma <strong>empresa</strong> e uma <strong>frota</strong> desta empresa. Uma empresa pode ter várias frotas vinculadas.</p></div>' +
        '<div class="col-sm-6"><div class="form-group"><label>Cliente *</label><select class="form-control" id="lk_customer" required><option value="">Selecione...</option>' +
        opts(d.customers, "id", function (x) { return x.name; }, lk.customer_id) + "</select></div></div>" +
        '<div class="col-sm-6"><div class="form-group"><label>Empresa *</label><select class="form-control" id="lk_company" required><option value="">Selecione...</option>' +
        opts(d.companies, "id", function (x) { return x.name + " — " + x.cnpj; }, lk.company_id) + "</select></div></div>" +
        '<div class="col-sm-6"><div class="form-group"><label>Frota / Centro de cobrança *</label><select class="form-control" id="lk_fleet" required disabled><option value="">Selecione a empresa primeiro...</option></select><small class="text-muted">Somente frotas da empresa selecionada</small></div></div>' +
        '<div class="col-sm-6"><div class="form-group"><label>Limite específico (R$)</label><input type="number" class="form-control" id="lk_limit" placeholder="Usar padrão da configuração" value="' + (lk.specific_credit_limit || "") + '"></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Ajuste específico</label><select class="form-control" id="lk_adjtype">' +
        '<option value="none"' + sel("none", lk.specific_adjustment_type || "none") + '>Nenhum</option>' +
        '<option value="discount"' + sel("discount", lk.specific_adjustment_type) + '>Desconto</option>' +
        '<option value="increase"' + sel("increase", lk.specific_adjustment_type) + '>Acréscimo</option></select></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Valor (%)</label><input type="number" step="0.01" class="form-control" id="lk_adjval" value="' + (lk.specific_adjustment_value || 0) + '"></div></div>' +
        '<div class="col-sm-4"><div class="form-group"><label>Status</label><select class="form-control" id="lk_status">' +
        '<option value="active"' + sel("active", lk.status || "active") + '>Ativo</option>' +
        '<option value="inactive"' + sel("inactive", lk.status) + '>Inativo</option></select></div></div>' +
        '<div class="col-sm-6"><div class="form-group"><label>Vigência inicial</label><input type="date" class="form-control" id="lk_vfrom" value="' + (lk.valid_from || "2026-01-01") + '"></div></div>' +
        '<div class="col-sm-6"><div class="form-group"><label>Vigência final</label><input type="date" class="form-control" id="lk_vuntil" value="' + (lk.valid_until || "2026-12-31") + '"></div></div></div>';
      BillingUI.openModal(existing ? "Editar vínculo empresa / frota" : "Vincular cliente / empresa / frota", html, function () {
        var customer = document.getElementById("lk_customer").value;
        var company = document.getElementById("lk_company").value;
        var fleet = document.getElementById("lk_fleet").value;
        if (!customer || !company || !fleet) {
          BillingUI.toast("Preencha cliente, empresa e frota.", "error");
          return false;
        }
        var link = {
          id: existing ? existing.id : BillingStore.uid("lnk"),
          configuration_id: configId,
          customer_id: customer,
          company_id: company,
          fleet_id: fleet,
          specific_adjustment_type: document.getElementById("lk_adjtype").value,
          specific_adjustment_value: parseFloat(document.getElementById("lk_adjval").value) || 0,
          specific_credit_limit: document.getElementById("lk_limit").value ? parseFloat(document.getElementById("lk_limit").value) : null,
          valid_from: document.getElementById("lk_vfrom").value,
          valid_until: document.getElementById("lk_vuntil").value,
          status: document.getElementById("lk_status").value
        };
        var err = BillingStore.validateLink(link, existing ? existing.id : null);
        if (err) { BillingUI.toast(err, "error"); return false; }
        if (existing) {
          d.links = d.links.map(function (x) { return x.id === existing.id ? link : x; });
          if (link.status !== "active") d = BillingStore.removeOpenCyclesForLink(d, link.id);
          else d = BillingStore.ensureOpenCycleForLink(d, link);
        } else {
          d.links.push(link);
          d = BillingStore.ensureOpenCycleForLink(d, link);
        }
        BillingStore.setData(d);
        expanded[configId] = true;
        render();
        BillingUI.toast(existing ? "Vínculo atualizado." : "Vínculo criado. Faturamento em aberto gerado.", "success");
        return true;
      }, { size: "lg" });
      setTimeout(function () { bindLinkModalFleetFilter(lk.fleet_id); }, 150);
    }

    var addBtn = document.getElementById("btn-add-config");
    if (addBtn) addBtn.onclick = function (e) { e.preventDefault(); openConfigModal(null); };
    render();
    BillingUI.bindSearch("search-configs", "tbody-configs");
  },

  gestao: function () {
    var viewMode = "open";
    var d0 = BillingStore.syncOpenCycles(BillingStore.getData());
    BillingStore.setData(d0);

    function isOpenStatus(s) {
      return BillingStore.isOpenCycleStatus(s);
    }

    function filteredCycles() {
      return BillingStore.getData().cycles.filter(function (c) {
        return viewMode === "open" ? isOpenStatus(c.status) : !isOpenStatus(c.status);
      });
    }

    function render() {
      document.querySelectorAll(".bill-tab-btn").forEach(function (btn) {
        btn.classList.toggle("bill-tab-active", btn.getAttribute("data-tab") === viewMode);
      });
      var list = filteredCycles();
      var tbody = document.getElementById("tbody-cycles");
      if (!tbody) return;
      tbody.innerHTML = list.length ? list.map(function (cy) {
        var cust = BillingStore.customerById(cy.customer_id);
        var emp = BillingStore.companyById(cy.company_id);
        var fleet = BillingStore.fleetById(cy.fleet_id);
        var cfg = BillingStore.configById(cy.configuration_id);
        var adj = cy.discount_amount > 0
          ? BillingLabels.adjustment("discount", "fixed_amount", cy.discount_amount)
          : cy.increase_amount > 0
            ? BillingLabels.adjustment("increase", "fixed_amount", cy.increase_amount)
            : "—";
        var sent = cy.sent_at ? '<small>' + new Date(cy.sent_at).toLocaleString("pt-BR") + "</small>" : "—";
        var actions =
          '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline btn-detail" data-id="' + cy.id + '"><i class="fa fa-eye"></i> Detalhes</button> ' +
          '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline tw-dw-btn-primary btn-nfe-cycle" data-id="' + cy.id + '" title="Ver notas fiscais">' +
          '<svg class="bill-btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/><path d="M9 9h1"/><path d="M9 13h6"/><path d="M9 17h6"/></svg> Notas</button> ';
        if (isOpenStatus(cy.status)) {
          actions += '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-bg-gradient-to-r tw-from-indigo-600 tw-to-blue-500 tw-text-white tw-border-none btn-close-cycle" data-id="' + cy.id + '">Fechar</button>';
        } else {
          actions += '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline btn-send-cycle" data-id="' + cy.id + '"><i class="fa fa-envelope"></i> Enviar</button> ';
          if (cy.sent_at) actions += '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline btn-resend-cycle" data-id="' + cy.id + '"><i class="fa fa-repeat"></i> Reenviar</button>';
        }
        return (
          "<tr class=\"bill-main-row\"><td>" + actions + "</td>" +
          "<td><strong>" + (cust ? BillingUI.esc(cust.name.split("—")[0].trim()) : "—") + "</strong><br><small class=\"text-muted\">" + (emp ? emp.name : "") + "</small></td>" +
          "<td>" + (fleet ? fleet.name : "—") + "</td>" +
          "<td>" + (cfg ? BillingUI.esc(cfg.name) : "—") + "</td>" +
          "<td><small>" + BillingStore.formatDateRange(cy.reference_start, cy.reference_end) + "</small></td>" +
          "<td class=\"text-center\">" + cy.invoice_count + "</td>" +
          "<td>" + BillingStore.formatMoney(cy.gross_amount) + "</td>" +
          "<td>" + adj + "</td>" +
          "<td><strong>" + BillingStore.formatMoney(cy.net_amount) + "</strong></td>" +
          "<td>" + BillingStore.formatDate(cy.due_date) + "</td>" +
          "<td>" + BillingLabels.cycleStatus(cy.status) + "</td>" +
          "<td>" + sent + "</td></tr>"
        );
      }).join("") : '<tr><td colspan="12" class="text-center text-muted">Nenhum faturamento neste filtro.</td></tr>';
      var info = document.getElementById("cycle-count-info");
      var activeLinks = BillingStore.activeLinks().length;
      if (info) {
        if (viewMode === "open") {
          info.textContent = list.length
            ? "Mostrando " + list.length + " faturamento(s) em aberto — " + activeLinks + " vínculo(s) ativo(s)"
            : "Nenhum faturamento em aberto";
        } else {
          info.textContent = list.length ? "Mostrando " + list.length + " faturamento(s) fechado(s)" : "";
        }
      }
      bindCycleActions();
    }

    function bindCycleActions() {
      document.querySelectorAll(".btn-detail").forEach(function (btn) {
        btn.onclick = function () { openDetailModal(btn.getAttribute("data-id"), { tab: "resumo" }); };
      });
      document.querySelectorAll(".btn-nfe-cycle").forEach(function (btn) {
        btn.onclick = function () { openDetailModal(btn.getAttribute("data-id"), { tab: "nfes" }); };
      });
      document.querySelectorAll(".btn-close-cycle").forEach(function (btn) {
        btn.onclick = function () {
          if (!confirm("Fechar este faturamento? Os valores serão congelados.")) return;
          var d = BillingStore.getData();
          var cy = d.cycles.filter(function (x) { return x.id === btn.getAttribute("data-id"); })[0];
          if (!cy || !cy.invoice_count) { BillingUI.toast("Faturamento sem notas.", "error"); return; }
          cy.status = "closed";
          cy.closed_at = new Date().toISOString();
          cy.portal_link = "https://portal.demo.ecomercial/cliente/fat-" + cy.id;
          d.history.push({ id: BillingStore.uid("h"), cycle_id: cy.id, action: "closed", at: cy.closed_at, user: "Admin", detail: "Faturamento fechado" });
          BillingStore.setData(d);
          render();
          BillingUI.toast("Faturamento fechado.", "success");
        };
      });
      document.querySelectorAll(".btn-send-cycle, .btn-resend-cycle").forEach(function (btn) {
        btn.onclick = function () {
          var isResend = btn.classList.contains("btn-resend-cycle");
          var d = BillingStore.getData();
          var cy = d.cycles.filter(function (x) { return x.id === btn.getAttribute("data-id"); })[0];
          var cust = cy ? BillingStore.customerById(cy.customer_id) : null;
          if (!cy || cy.status === "open") { BillingUI.toast("Feche o faturamento antes de enviar.", "warn"); return; }
          if (!cust || !cust.email) { BillingUI.toast("Cliente sem e-mail.", "error"); return; }
          var now = new Date().toISOString();
          cy.sent_at = cy.sent_at || now;
          cy.last_sent_at = now;
          cy.status = isResend ? "resent" : "sent";
          d.send_logs.push({ id: BillingStore.uid("sl"), cycle_id: cy.id, email_to: cust.email, sent_at: now, status: "success", sent_by: "Admin" });
          d.history.push({ id: BillingStore.uid("h"), cycle_id: cy.id, action: isResend ? "resent" : "sent", at: now, user: "Admin", detail: "E-mail com link do portal (simulação)" });
          BillingStore.setData(d);
          render();
          BillingUI.toast((isResend ? "Reenvio" : "Envio") + " simulado para " + cust.email, "success");
        };
      });
    }

    function openDetailModal(cycleId, options) {
      options = options || {};
      var tab = options.tab || "resumo";
      var cy = BillingStore.getData().cycles.filter(function (x) { return x.id === cycleId; })[0];
      if (!cy) return;
      var cust = BillingStore.customerById(cy.customer_id);
      var emp = BillingStore.companyById(cy.company_id);
      var fleet = BillingStore.fleetById(cy.fleet_id);
      var items = BillingStore.itemsForCycle(cycleId);
      var logs = BillingStore.logsForCycle(cycleId);
      var hist = BillingStore.historyForCycle(cycleId);
      var locked = !isOpenStatus(cy.status);
      var itemsHtml = items.length ? items.map(function (it) {
        return "<tr><td>" + it.nfe_number + "</td><td>" + it.nfe_series + "</td><td><small title=\"" + BillingUI.esc(it.nfe_key) + "\">" + it.nfe_key.slice(0, 20) + "…</small></td><td>" + BillingStore.formatDate(it.issue_date) + "</td><td>" + BillingStore.formatMoney(it.net_amount) + "</td><td>" + BillingUI.esc(it.plate) + "</td><td>" + BillingUI.esc(it.product) + "</td>" +
          '<td><button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline btn-view-nfe" data-id="' + it.id + '">Abrir</button></td>' +
          (locked ? "" : '<td><button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-error btn-rm-item" data-id="' + it.id + '">Remover</button></td>') + "</tr>";
      }).join("") : '<tr><td colspan="' + (locked ? "8" : "9") + '" class="text-muted text-center">Nenhuma nota vinculada.</td></tr>';

      var discountField = locked
        ? "<strong>" + BillingStore.formatMoney(cy.discount_amount) + "</strong>"
        : '<div class="bill-discount-edit">' +
          '<input type="number" step="0.01" min="0" class="form-control input-sm" id="cy-discount-input" value="' + Number(cy.discount_amount || 0).toFixed(2) + '">' +
          '<button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-primary tw-text-white" id="btn-apply-discount">Aplicar</button></div>';

      var body =
        '<div class="bill-detail-header">' +
        "<p><strong>Cliente:</strong> " + (cust ? cust.name : "—") + " · <strong>Empresa:</strong> " + (emp ? emp.name + " (" + emp.cnpj + ")" : "—") + "</p>" +
        "<p><strong>Frota:</strong> " + (fleet ? fleet.name : "—") + " · <strong>Período:</strong> " + BillingStore.formatDateRange(cy.reference_start, cy.reference_end) + " · " + BillingLabels.cycleStatus(cy.status) + "</p>" +
        '<div class="bill-detail-totals"><span>Bruto: <strong id="cy-gross-display">' + BillingStore.formatMoney(cy.gross_amount) + '</strong></span><span>Desconto: <strong id="cy-discount-display">' + BillingStore.formatMoney(cy.discount_amount) + "</strong></span><span>Líquido: <strong id=\"cy-net-display\">" + BillingStore.formatMoney(cy.net_amount) + "</strong></span><span>Venc.: " + BillingStore.formatDate(cy.due_date) + "</span></div></div>" +
        '<ul class="nav nav-tabs bill-detail-tabs" role="tablist">' +
        '<li class="' + (tab === "resumo" ? "active" : "") + '"><a data-toggle="tab" href="#tab-resumo">Resumo</a></li>' +
        '<li class="' + (tab === "nfes" ? "active" : "") + '"><a data-toggle="tab" href="#tab-nfes">Notas fiscais (' + cy.invoice_count + ")</a></li>" +
        '<li class="' + (tab === "envios" ? "active" : "") + '"><a data-toggle="tab" href="#tab-envios">Envios</a></li>' +
        '<li class="' + (tab === "hist" ? "active" : "") + '"><a data-toggle="tab" href="#tab-hist">Histórico</a></li></ul>' +
        '<div class="tab-content bill-detail-panels">' +
        '<div id="tab-resumo" class="tab-pane' + (tab === "resumo" ? " active" : "") + '"><ul class="bill-summary-list">' +
        "<li><span>Notas fiscais</span><strong>" + cy.invoice_count + "</strong></li>" +
        "<li><span>Valor bruto</span><strong id=\"cy-gross-summary\">" + BillingStore.formatMoney(cy.gross_amount) + "</strong></li>" +
        '<li class="bill-summary-editable"><span>Desconto no total (R$)</span>' + discountField + "</li>" +
        "<li><span>Acréscimos (regra)</span><strong>" + BillingStore.formatMoney(cy.increase_amount) + "</strong></li>" +
        "<li><span>Valor líquido</span><strong id=\"cy-net-summary\">" + BillingStore.formatMoney(cy.net_amount) + "</strong></li>" +
        "<li><span>Link do portal</span><strong>" + (cy.portal_link ? '<a href="#" onclick="return false">' + cy.portal_link + "</a>" : "—") + "</strong></li></ul>" +
        (locked ? "" : '<p class="text-muted tw-text-xs tw-mt-2">O desconto manual altera o valor líquido enquanto o faturamento estiver em aberto.</p>') +
        "</div>" +
        '<div id="tab-nfes" class="tab-pane' + (tab === "nfes" ? " active" : "") + '">' +
        (locked ? "" : '<p><button type="button" class="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline" id="btn-add-demo-nfe">+ Adicionar nota (demo)</button></p>') +
        '<table class="table table-bordered table-condensed"><thead><tr><th>Nº</th><th>Série</th><th>Chave</th><th>Emissão</th><th>Valor</th><th>Placa</th><th>Produto</th><th></th>' + (locked ? "" : "<th></th>") + "</tr></thead><tbody id=\"detail-nfe-body\">" + itemsHtml + "</tbody></table></div>" +
        '<div id="tab-envios" class="tab-pane' + (tab === "envios" ? " active" : "") + '"><table class="table table-condensed"><thead><tr><th>Data</th><th>E-mail</th><th>Status</th><th>Usuário</th></tr></thead><tbody>' +
        (logs.length ? logs.map(function (l) {
          return "<tr><td>" + new Date(l.sent_at).toLocaleString("pt-BR") + "</td><td>" + l.email_to + "</td><td><span class=\"label label-success\">" + l.status + "</span></td><td>" + l.sent_by + "</td></tr>";
        }).join("") : '<tr><td colspan="4" class="text-muted">Nenhum envio.</td></tr>') + "</tbody></table></div>" +
        '<div id="tab-hist" class="tab-pane' + (tab === "hist" ? " active" : "") + '"><ul class="bill-timeline">' +
        hist.map(function (h) {
          return "<li><strong>" + h.action + "</strong> — " + h.detail + "<br><small class=\"text-muted\">" + new Date(h.at).toLocaleString("pt-BR") + " · " + h.user + "</small></li>";
        }).join("") + "</ul></div></div>";

      BillingUI.openModal("Detalhes do faturamento", body, null, { size: "xl", hideSave: true });
      setTimeout(function () {
        function applyDiscount() {
          var input = document.getElementById("cy-discount-input");
          if (!input) return;
          var d = BillingStore.getData();
          var c = d.cycles.filter(function (x) { return x.id === cycleId; })[0];
          if (!c || locked) return;
          var discount = parseFloat(input.value);
          if (isNaN(discount) || discount < 0) {
            BillingUI.toast("Informe um desconto válido.", "error");
            return;
          }
          if (discount > c.gross_amount) {
            BillingUI.toast("Desconto não pode ser maior que o valor bruto.", "error");
            return;
          }
          c.discount_amount = discount;
          BillingStore.recalculateNet(c);
          d.history.push({
            id: BillingStore.uid("h"),
            cycle_id: cycleId,
            action: "discount_adjusted",
            at: new Date().toISOString(),
            user: "Admin",
            detail: "Desconto manual aplicado: " + BillingStore.formatMoney(discount)
          });
          BillingStore.setData(d);
          BillingUI.toast("Desconto aplicado. Valor líquido atualizado.", "success");
          jQuery(".poc_modal").modal("hide");
          openDetailModal(cycleId, options);
          render();
        }

        var applyBtn = document.getElementById("btn-apply-discount");
        if (applyBtn) applyBtn.onclick = applyDiscount;
        var discountInput = document.getElementById("cy-discount-input");
        if (discountInput) {
          discountInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") applyDiscount();
          });
        }

        var addNfe = document.getElementById("btn-add-demo-nfe");
        if (addNfe) {
          addNfe.onclick = function () {
            var d = BillingStore.getData();
            d.cycle_items.push({
              id: BillingStore.uid("ci"),
              cycle_id: cycleId,
              nfe_number: String(10000 + Math.floor(Math.random() * 9000)),
              nfe_series: "1",
              nfe_key: "352606" + Date.now(),
              issue_date: new Date().toISOString().slice(0, 10),
              gross_amount: 1500,
              net_amount: 1530,
              plate: "XYZ-9K88",
              product: "Diesel S10"
            });
            d = BillingStore.recalculateCycleFromItems(d, cycleId);
            BillingStore.setData(d);
            jQuery(".poc_modal").modal("hide");
            openDetailModal(cycleId, { tab: "nfes" });
            BillingUI.toast("Nota adicionada (demo).", "success");
            render();
          };
        }
        document.querySelectorAll(".btn-rm-item").forEach(function (b) {
          b.onclick = function () {
            var d = BillingStore.getData();
            var it = d.cycle_items.filter(function (x) { return x.id === b.getAttribute("data-id"); })[0];
            if (!it) return;
            d.cycle_items = d.cycle_items.filter(function (x) { return x.id !== it.id; });
            d = BillingStore.recalculateCycleFromItems(d, cycleId);
            BillingStore.setData(d);
            jQuery(".poc_modal").modal("hide");
            openDetailModal(cycleId, { tab: "nfes" });
            BillingUI.toast("Nota removida.", "success");
            render();
          };
        });
        document.querySelectorAll(".btn-view-nfe").forEach(function (b) {
          b.onclick = function () {
            var it = BillingStore.getData().cycle_items.filter(function (x) { return x.id === b.getAttribute("data-id"); })[0];
            if (!it) return;
            BillingUI.openModal(
              "NF-e " + it.nfe_number + " / Série " + it.nfe_series,
              '<div class="bill-nfe-view">' +
              "<p><strong>Chave de acesso</strong><br><code>" + BillingUI.esc(it.nfe_key) + "</code></p>" +
              "<p><strong>Emissão:</strong> " + BillingStore.formatDate(it.issue_date) + "</p>" +
              "<p><strong>Valor líquido:</strong> " + BillingStore.formatMoney(it.net_amount) + "</p>" +
              "<p><strong>Placa:</strong> " + BillingUI.esc(it.plate) + " · <strong>Produto:</strong> " + BillingUI.esc(it.product) + "</p>" +
              "</div>",
              null,
              { hideSave: true }
            );
          };
        });
      }, 200);
    }

    document.querySelectorAll(".bill-tab-btn").forEach(function (btn) {
      btn.onclick = function () {
        viewMode = btn.getAttribute("data-tab");
        render();
      };
    });
    render();
    BillingUI.bindSearch("search-cycles", "tbody-cycles");
  }
};
