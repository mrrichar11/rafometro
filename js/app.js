/**
 * El Rafómetro - Controlador Principal Retro Gamer Minimalista
 * Manejo de navegación, widget de Corchito Canelón y control de audio.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo de Pestañas (Tabs)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        tabButtons.forEach(btn => {
            const isActive = btn.getAttribute('data-tab') === tabId;
            btn.classList.toggle('active', isActive);
            btn.classList.toggle('bg-white', !isActive);
            btn.classList.toggle('text-slate-800', !isActive);
        });

        tabContents.forEach(content => {
            if (content.id === tabId) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        if (window.soundSystem) {
            window.soundSystem.playClick();
        }

        if (tabId === 'tab-game' && window.rayoGame) {
            setTimeout(() => window.rayoGame.resizeCanvas(), 50);
        }

        const mainContent = document.getElementById('mainContentArea');
        if (mainContent) {
            mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Si el tab inicial es el juego, redimensionar canvas
    setTimeout(() => {
        if (window.rayoGame) window.rayoGame.resizeCanvas();
    }, 100);

    // 2. Control de Sonido
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    const soundStatusText = document.getElementById('soundStatusText');

    function updateSoundUI() {
        if (!soundToggleBtn || !window.soundSystem) return;
        const isEnabled = window.soundSystem.enabled;

        if (isEnabled) {
            soundToggleBtn.classList.remove('opacity-60');
            if (soundStatusText) soundStatusText.textContent = 'FX: ON';
        } else {
            soundToggleBtn.classList.add('opacity-60');
            if (soundStatusText) soundStatusText.textContent = 'FX: OFF';
        }
    }

    if (soundToggleBtn) {
        updateSoundUI();
        soundToggleBtn.addEventListener('click', () => {
            if (window.soundSystem) {
                window.soundSystem.toggle();
                updateSoundUI();
            }
        });
    }

    // 3. Widget Interactivo de Corchito Canelón (El Perro Salchicha Guardián)
    const corchitoWidget = document.getElementById('corchitoMascotWidget');
    const corchitoBubble = document.getElementById('corchitoSpeechBubble');
    const corchitoAvatar = document.getElementById('corchitoAvatarImg');

    const corchitoQuotes = [
        "¡Guau! 🐾 Huele a comentarios llenos de envidia por acá.",
        "Soy Corchito Canelón. Si tirás mala onda, te muerdo las medias.",
        "¡Dejen de tirar hate y vayan a ponerle dulce de leche a las tostadas!",
        "Falsa humildad las bolas, ¡aguante Jennia y los salchichas!",
        "¿Ya te suscribiste al canal de YouTube de Jenny?",
        "Prendé Kick que Kakarotta está en vivo, ¡guau!"
    ];

    if (corchitoWidget) {
        corchitoWidget.addEventListener('click', () => {
            if (window.soundSystem) {
                window.soundSystem.playCorchitoBark();
            }

            if (corchitoAvatar) {
                corchitoAvatar.classList.remove('bark-active');
                void corchitoAvatar.offsetWidth; // trigger reflow
                corchitoAvatar.classList.add('bark-active');
            }

            if (corchitoBubble) {
                const randomQuote = corchitoQuotes[Math.floor(Math.random() * corchitoQuotes.length)];
                corchitoBubble.textContent = randomQuote;
                corchitoBubble.classList.remove('hidden');

                setTimeout(() => {
                    corchitoBubble.classList.add('hidden');
                }, 3500);
            }
        });
    }

    // 4. Hero Rafaseñal interactiva
    const heroRafasignal = document.getElementById('heroRafasignal');
    if (heroRafasignal) {
        heroRafasignal.addEventListener('click', () => {
            if (window.soundSystem) {
                window.soundSystem.playScouterExplosion();
            }
            heroRafasignal.classList.add('scale-105');
            setTimeout(() => heroRafasignal.classList.remove('scale-105'), 200);
        });
    }

    // Botones de salto entre módulos
    const jumpToGameBtns = document.querySelectorAll('.jump-to-game');
    jumpToGameBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab('tab-game'));
    });

    const jumpToAnalyzerBtns = document.querySelectorAll('.jump-to-analyzer');
    jumpToAnalyzerBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab('tab-scouter'));
    });

    const jumpToTestBtns = document.querySelectorAll('.jump-to-test');
    jumpToTestBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab('tab-test'));
    });
});
