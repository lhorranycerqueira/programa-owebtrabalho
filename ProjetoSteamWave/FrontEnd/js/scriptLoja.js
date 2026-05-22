      let toastTimer;
      function showToast(msg) {
        const t = document.getElementById("toast");
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
      }

      // ===== SEARCH TOGGLE =====
      function toggleSearch() {
        const bar = document.getElementById("searchBar");
        bar.classList.toggle("open");
        if (bar.classList.contains("open")) {
          bar.querySelector("input").focus();
        }
      }

      // ===== NOVA NAVEGAÇÃO DE PÁGINAS =====
      // Ao invés de esconder/mostrar DIVs, agora nós enviamos o usuário
      // de volta para o arquivo principal (steamwave.html) ou outras páginas.
      function goTo(url) {
        // Redireciona de verdade, o que faz o botão "Voltar" do navegador funcionar!
        window.location.href = url;
      }