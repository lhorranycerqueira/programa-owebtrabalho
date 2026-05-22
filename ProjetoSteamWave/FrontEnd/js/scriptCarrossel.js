      document.addEventListener("DOMContentLoaded", () => {
       // ===== STARS GENERATOR =====
      function generateStars(containerId, count = 80) {
        const c = document.getElementById(containerId);
        if (!c) return;
        for (let i = 0; i < count; i++) {
          const s = document.createElement("div");
          s.className = "star";
          const size = Math.random() * 2.5 + 0.5;
          s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 70}%;
      --dur:${Math.random() * 4 + 2}s;
      --delay:${Math.random() * 3}s;
      opacity:${Math.random() * 0.7 + 0.2};
    `;
          c.appendChild(s);
        }
      }
      generateStars("loginStars", 100);
      generateStars("homeStars", 100);
      generateStars("homenavStars", 80);
      });