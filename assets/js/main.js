(function () {
  var header = document.querySelector("[data-header]");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var nav = document.querySelector("[data-nav]");
  var dropdowns = document.querySelectorAll(".has-dropdown");
  var leadForms = document.querySelectorAll("[data-lead-form]");
  var accordions = document.querySelectorAll("[data-accordion]");
  var blogSearch = document.querySelector("[data-blog-search]");
  var emiForm = document.querySelector("[data-emi-form]");
  var year = document.querySelector("[data-year]");

  function closeDropdowns(except) {
    dropdowns.forEach(function (dropdown) {
      if (dropdown !== except) {
        dropdown.classList.remove("is-open");
        var toggle = dropdown.querySelector(".nav-dropdown-toggle");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  }

  function updateHeaderState() {
    if (!header) {
      return;
    }

    header.classList.toggle("is-scrolled", window.scrollY > 6);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
      style: "currency",
      currency: "INR"
    }).format(value);
  }

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  if (menuToggle && header && nav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("nav-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        header.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        header.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  dropdowns.forEach(function (dropdown) {
    var toggle = dropdown.querySelector(".nav-dropdown-toggle");

    if (!toggle) {
      return;
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = dropdown.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      closeDropdowns(dropdown);
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".has-dropdown")) {
      closeDropdowns();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeDropdowns();
    }
  });

  accordions.forEach(function (accordion) {
    accordion.addEventListener("click", function (event) {
      var question = event.target.closest(".faq-question");

      if (!question || !accordion.contains(question)) {
        return;
      }

      var item = question.closest(".faq-item");
      var isOpen = item.classList.toggle("is-open");
      question.setAttribute("aria-expanded", String(isOpen));
    });
  });

  // Lead form handling is managed by form-handler.js (saves to admin panel).
  // main.js no longer handles lead form submission to avoid conflicts.

  if (blogSearch) {
    blogSearch.addEventListener("input", function () {
      var term = blogSearch.value.trim().toLowerCase();
      document.querySelectorAll("[data-article-card]").forEach(function (card) {
        var text = card.textContent.toLowerCase();
        card.hidden = term.length > 0 && !text.includes(term);
      });
    });
  }

  if (emiForm) {
    emiForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var amount = Number(emiForm.querySelector("[name='loanAmount']").value);
      var annualRate = Number(emiForm.querySelector("[name='interestRate']").value);
      var tenureYears = Number(emiForm.querySelector("[name='loanTenure']").value);
      var result = document.querySelector("[data-emi-result]");

      if (!amount || !annualRate || !tenureYears || !result) {
        return;
      }

      var monthlyRate = annualRate / 12 / 100;
      var months = tenureYears * 12;
      var emi = amount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      var totalPayment = emi * months;
      var totalInterest = totalPayment - amount;

      result.querySelector("[data-emi]").textContent = formatCurrency(emi);
      result.querySelector("[data-interest]").textContent = formatCurrency(totalInterest);
      result.querySelector("[data-payment]").textContent = formatCurrency(totalPayment);
    });
  }
})();
