// 1. HABILITAR CLIQUE DO MENU HAMBÚRGUER
function toggleSidebar() {
  const sidebar = document.getElementById("brawlSidebar");
  sidebar.classList.toggle("open");
}

// 2. COLOR PICKER GLOBLAL (SINCADO ENTRE AS DUAS JANELAS)
document.addEventListener('DOMContentLoaded', () => {
  const corSalva = localStorage.getItem('perfil-cor-custom');
  const picker = document.getElementById('profile-color-picker');

  if (corSalva) {
    picker.value = corSalva;
    document.documentElement.style.setProperty('--retro-accent', corSalva);
    document.documentElement.style.setProperty('--retro-bars', corSalva);
  }
});

document.getElementById('profile-color-picker').addEventListener('input', function(event) {
  const corEscolhida = event.target.value;
  
  // Aplica em todo o documento para atualizar ambas as janelas de uma vez só!
  document.documentElement.style.setProperty('--retro-accent', corEscolhida);
  document.documentElement.style.setProperty('--retro-bars', corEscolhida);
  
  localStorage.setItem('perfil-cor-custom', corEscolhida);
});

// 2.5 COLOR PICKER DA JANELA DE CONFIGURAÇÃO (INDEPENDENTE)
document.addEventListener('DOMContentLoaded', () => {
  const corConfigSalva = localStorage.getItem('config-cor-custom');
  const configPicker = document.getElementById('config-color-picker');

  // Se já tiver uma cor salva, aplica nas novas variáveis
  if (corConfigSalva && configPicker) {
    configPicker.value = corConfigSalva;
    document.documentElement.style.setProperty('--config-accent', corConfigSalva);
    document.documentElement.style.setProperty('--config-bars', corConfigSalva);
  }

  // Quando o usuário escolhe uma nova cor no balde da config
  if (configPicker) {
    configPicker.addEventListener('input', function(event) {
      const corEscolhida = event.target.value;
      
      document.documentElement.style.setProperty('--config-accent', corEscolhida);
      document.documentElement.style.setProperty('--config-bars', corEscolhida);
      
      localStorage.setItem('config-cor-custom', corEscolhida);
    });
  }
});


// 3. EDITORES INLINE (NICKNAME, BIO, TITULO DA ABA) COM CONTADORES
document.addEventListener('DOMContentLoaded', () => {
  const fields = [
    { id: 'profile-tab-title', max: 15, storage: 'custom-tab', counterId: null, isTab: true },
    { id: 'user-display-name', max: 30, storage: 'custom-nick', counterId: 'nick-counter', isTab: false },
    { id: 'user-bio', max: 220, storage: 'custom-bio', counterId: 'bio-counter', isTab: false }
  ];

  fields.forEach(field => {
    const el = document.getElementById(field.id);
    if (!el) return;

    const savedValue = localStorage.getItem(field.storage);
    if (savedValue) {
      el.textContent = savedValue;
    }

    const counterEl = field.counterId ? document.getElementById(field.counterId) : null;
    
    const updateCounter = () => {
      if (counterEl) {
        counterEl.textContent = `${el.textContent.length}/${field.max}`;
      }
    };

    updateCounter();

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.blur(); 
      }
    });

    el.addEventListener('input', () => {
      if (el.textContent.length > field.max) {
        el.textContent = el.textContent.substring(0, field.max);
        
        // Mantém o cursor piscando no fim do texto
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      updateCounter();
    });

    el.addEventListener('blur', () => {
      let textValue = el.textContent.trim();

      if (textValue === "") {
        if (field.isTab) {
          textValue = "PERFIL.EXE";
        } else if (field.id === 'user-display-name') {
          textValue = "! Megane ツ";
        } else {
          textValue = "Biografia vazia...";
        }
        el.textContent = textValue;
      }

      localStorage.setItem(field.storage, textValue);
      updateCounter();
    });
  });
});

// =========================================
// 3.1 UPLOAD DE AVATAR E BANNER PELO CLIQUE
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  const avatarInput = document.getElementById('avatar-upload-input');
  const bannerInput = document.getElementById('banner-upload-input');
  
  const avatarOverlay = document.querySelector('.avatar-edit-overlay');
  const bannerOverlay = document.querySelector('.banner-edit-overlay');
  
  const avatarImg = document.getElementById('user-avatar');
  const bannerDiv = document.querySelector('.profile-banner'); 

  // 1. Simula o clique nos inputs ocultos quando clica nos overlays
  if (avatarOverlay) {
    avatarOverlay.addEventListener('click', () => avatarInput.click());
  }
  if (bannerOverlay) {
    bannerOverlay.addEventListener('click', () => bannerInput.click());
  }

  // 2. Lógica para trocar e salvar o Avatar
  if (avatarInput) {
    avatarInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const novaImagem = e.target.result;
          avatarImg.src = novaImagem;
          localStorage.setItem('user-avatar-custom', novaImagem);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 3. Lógica para trocar e salvar o Banner
  if (bannerInput) {
    bannerInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const novaImagem = e.target.result;
          bannerDiv.style.backgroundImage = `url('${novaImagem}')`;
          localStorage.setItem('user-banner-custom', novaImagem);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 4. Carrega as imagens salvas ao abrir a página novamente
  const savedAvatar = localStorage.getItem('user-avatar-custom');
  const savedBanner = localStorage.getItem('user-banner-custom');
  
  if (savedAvatar && avatarImg) {
    avatarImg.src = savedAvatar;
  }
  if (savedBanner && bannerDiv) {
    bannerDiv.style.backgroundImage = `url('${savedBanner}')`;
  }
});

// 4. INTEGRAÇÃO DOS BOTÕES DA JANELA DE CONFIGURAÇÃO EM TEMPO REAL (E LOCAL STORAGE)
document.addEventListener('DOMContentLoaded', () => {
  
  // A. CUSTOMIZAR AVATAR (FOTO DE PERFIL) VIA UPLOAD
  const avatarInput = document.getElementById('edit-avatar-input');
  const userAvatar = document.getElementById('user-avatar');

  // Carrega avatar customizado salvo
  const savedAvatar = localStorage.getItem('custom-avatar');
  if (savedAvatar) {
    userAvatar.src = savedAvatar;
  }

  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        userAvatar.src = event.target.result;
        localStorage.setItem('custom-avatar', event.target.result); // Salva em Base64 no F5
      };
      reader.readAsDataURL(file);
    }
  });

  // B. CUSTOMIZAR BORDA DO AVATAR
  const borderSelect = document.getElementById('edit-border-select');
  const avatarHolder = document.getElementById('user-avatar-holder');

  const savedBorder = localStorage.getItem('custom-border');
  if (savedBorder) {
    borderSelect.value = savedBorder;
    avatarHolder.className = 'avatar-holder ' + (savedBorder !== 'none' ? savedBorder : '');
  }

  borderSelect.addEventListener('change', (e) => {
    const chosenBorder = e.target.value;
    avatarHolder.className = 'avatar-holder ' + (chosenBorder !== 'none' ? chosenBorder : '');
    localStorage.setItem('custom-border', chosenBorder);
  });

  // C. FONTE DO NICK
  const fontSelect = document.getElementById('edit-font-select');
  const displayName = document.getElementById('user-display-name');

  const savedFont = localStorage.getItem('custom-font');
  if (savedFont) {
    fontSelect.value = savedFont;
    displayName.style.fontFamily = savedFont;
  }

  fontSelect.addEventListener('change', (e) => {
    const chosenFont = e.target.value;
    displayName.style.fontFamily = chosenFont;
    localStorage.setItem('custom-font', chosenFont);
  });

  // D. DEGRADÊ DE CORES DO NICKNAME (DOIS COLOR PICKERS)
  const nameColor1 = document.getElementById('name-color-1');
  const nameColor2 = document.getElementById('name-color-2');

  function aplicarDegradeNick() {
    const col1 = nameColor1.value;
    const col2 = nameColor2.value;

    displayName.style.background = `linear-gradient(90deg, ${col1}, ${col2})`;
    displayName.style.webkitBackgroundClip = 'text';
    displayName.style.webkitTextFillColor = 'transparent';
    displayName.style.display = 'inline-block';

    localStorage.setItem('name-color-1', col1);
    localStorage.setItem('name-color-2', col2);
  }

  // Carrega cores salvas
  const savedColor1 = localStorage.getItem('name-color-1');
  const savedColor2 = localStorage.getItem('name-color-2');
  if (savedColor1 && savedColor2) {
    nameColor1.value = savedColor1;
    nameColor2.value = savedColor2;
    aplicarDegradeNick();
  }

  nameColor1.addEventListener('input', aplicarDegradeNick);
  nameColor2.addEventListener('input', aplicarDegradeNick);

  // E. CUSTOMIZAR BANNER VIA UPLOAD
  const bannerInput = document.getElementById('edit-banner-input');
  const userBanner = document.getElementById('user-banner');

  const savedBanner = localStorage.getItem('custom-banner');
  if (savedBanner) {
    userBanner.style.backgroundImage = `url('${savedBanner}')`;
  }

  bannerInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        userBanner.style.backgroundImage = `url('${event.target.result}')`;
        localStorage.setItem('custom-banner', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // F. INTERRUPTOR DE SCANLINES (EFEITO DE LINHAS) DO BANNER
  const toggleLines = document.getElementById('toggle-banner-lines');

  const savedLinesState = localStorage.getItem('custom-banner-lines');
  if (savedLinesState !== null) {
    const isChecked = savedLinesState === 'true';
    toggleLines.checked = isChecked;
    if (isChecked) {
      userBanner.classList.add('has-lines');
    } else {
      userBanner.classList.remove('has-lines');
    }
  } else {
    // Default ativo
    userBanner.classList.add('has-lines');
  }

  toggleLines.addEventListener('change', (e) => {
    if (e.target.checked) {
      userBanner.classList.add('has-lines');
    } else {
      userBanner.classList.remove('has-lines');
    }
    localStorage.setItem('custom-banner-lines', e.target.checked);
  });

  // G. EFEITO ANIMADO DE PERFIL (SOBREPOSIÇÃO)
  const effectSelect = document.getElementById('edit-effect-select');
  const effectOverlay = document.getElementById('profile-effect');

  const savedEffect = localStorage.getItem('custom-profile-effect');
  if (savedEffect) {
    effectSelect.value = savedEffect;
    effectOverlay.className = 'profile-effect-overlay ' + (savedEffect !== 'none' ? savedEffect : '');
  }

  effectSelect.addEventListener('change', (e) => {
    const chosenEffect = e.target.value;
    effectOverlay.className = 'profile-effect-overlay ' + (chosenEffect !== 'none' ? chosenEffect : '');
    localStorage.setItem('custom-profile-effect', chosenEffect);
  });

});


// 5. CARREGAMENTO BACKEND / MOCK DATA
document.addEventListener("DOMContentLoaded", () => {
  carregarDadosDoPerfil();
});

function carregarDadosDoPerfil() {
  const URL_BACKEND = "http://localhost:8080/api/perfil"; 

  fetch(URL_BACKEND)
    .then(response => {
      if (!response.ok) {
        throw new Error("Usuário não logado ou erro no banco.");
      }
      return response.json();
    })
    .then(data => {
      if (!localStorage.getItem('custom-nick')) {
        document.getElementById("user-display-name").textContent = data.display_name;
      }
      
      document.getElementById("user-username").textContent = "@" + data.username;
      
      if (!localStorage.getItem('custom-bio')) {
        document.getElementById("user-bio").innerHTML = data.bio.replace(/\n/g, '<br>');
      }
      
      if(data.avatar && !localStorage.getItem('custom-avatar')) {
        document.getElementById("user-avatar").src = data.avatar;
      }
    })
    .catch(() => {
      // Se falhar (Go offline), exibe Mock de segurança sem atropelar as edições salvas
      mostrarDadosMock();
    });
}

function mostrarDadosMock() {
  const nickEl = document.getElementById("user-display-name");
  if (!localStorage.getItem('custom-nick')) {
    nickEl.textContent = "! Megane ツ";
  }
  document.getElementById("user-username").textContent = "@hikamber_megane";
  
  const bioEl = document.getElementById("user-bio");
  if (!localStorage.getItem('custom-bio')) {
    bioEl.textContent = "-- https://guns.lol/megane -- \n🎵 Falso anjo - Oshaman";
  }
}