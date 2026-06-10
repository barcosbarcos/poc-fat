function billingBindLayout() {
  var page = document.body.getAttribute("data-page") || "inicio";
  var nav = document.querySelector('[data-nav="' + page + '"]');
  if (nav) {
    if (nav.classList.contains("theme-sidebar-child-hover")) {
      nav.classList.add("theme-sidebar-child-active");
      var toggle = document.getElementById("poc-billing-toggle");
      if (toggle) toggle.classList.add("theme-sidebar-active");
      var children = document.getElementById("poc-billing-children");
      if (children) children.style.display = "block";
    } else {
      nav.classList.add("theme-sidebar-active");
    }
  }
  if (["configuracao", "gestao"].indexOf(page) >= 0) {
    var bt = document.getElementById("poc-billing-toggle");
    var ch = document.getElementById("poc-billing-children");
    if (bt) bt.classList.add("theme-sidebar-active");
    if (ch) ch.style.display = "block";
  }
  var d = document.getElementById("poc-date");
  if (d) d.textContent = new Date().toLocaleDateString("pt-BR");
  var open = document.getElementById("poc-menu-open");
  var sidebar = document.getElementById("poc-side-bar");
  var overlay = document.getElementById("poc-overlay");
  if (open && sidebar) {
    open.addEventListener("click", function () {
      sidebar.classList.add("small-view-side-active");
      sidebar.style.display = "flex";
      if (overlay) {
        overlay.classList.remove("tw-hidden");
        overlay.classList.add("show");
      }
    });
  }
  if (overlay && sidebar) {
    overlay.addEventListener("click", function () {
      sidebar.classList.remove("small-view-side-active");
      overlay.classList.remove("show");
      overlay.classList.add("tw-hidden");
    });
  }
  var billingToggle = document.getElementById("poc-billing-toggle");
  var billingChildren = document.getElementById("poc-billing-children");
  if (billingToggle && billingChildren) {
    billingToggle.addEventListener("click", function (e) {
      e.preventDefault();
      billingChildren.style.display = billingChildren.style.display === "none" ? "block" : "none";
    });
  }
}
