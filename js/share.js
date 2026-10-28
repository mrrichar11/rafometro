/**
 * El Rafómetro - Generador de Tarjetas Gráficas para Redes Sociales
 * Genera imágenes en Canvas para Instagram Stories (9:16), WhatsApp y Twitter/X.
 */

class StoryCardGenerator {
    constructor() {
        this.modal = document.getElementById('shareModal');
        this.previewImg = document.getElementById('shareCardPreview');
        this.downloadBtn = document.getElementById('downloadCardBtn');
        this.nativeShareBtn = document.getElementById('nativeShareBtn');
        this.copyShareTextBtn = document.getElementById('copyShareTextBtn');
        this.closeModalBtn = document.getElementById('closeShareModalBtn');
        this.shareModalBackdrop = document.getElementById('shareModalBackdrop');

        this.currentBlob = null;
        this.currentText = '';
        this.currentTitle = '';

        // Precarga de imágenes para el canvas
        this.assets = {
            emblem: this.loadImage('assets/rafasenal_emblem.png'),
            corchito: this.loadImage('assets/corchito_canelon.png'),
            rafamalo: this.loadImage('assets/rafamalo.png'),
            rafabueno: this.loadImage('assets/rafabueno.png')
        };

        this.init();
    }

    loadImage(src) {
        const img = new Image();
        img.src = src;
        return img;
    }

    init() {
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadCard());
        }

        if (this.nativeShareBtn) {
            this.nativeShareBtn.addEventListener('click', () => this.nativeShare());
        }

        if (this.copyShareTextBtn) {
            this.copyShareTextBtn.addEventListener('click', () => this.copyText());
        }

        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        if (this.shareModalBackdrop) {
            this.shareModalBackdrop.addEventListener('click', (e) => {
                if (e.target === this.shareModalBackdrop) this.closeModal();
            });
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }

    openModal(dataUrl, blob, title, shareText) {
        this.currentBlob = blob;
        this.currentText = shareText;
        this.currentTitle = title;

        if (this.previewImg) {
            this.previewImg.src = dataUrl;
        }

        // Mostrar u ocultar botón de compartir nativo según soporte
        if (this.nativeShareBtn) {
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'test.png', { type: 'image/png' })] })) {
                this.nativeShareBtn.classList.remove('hidden');
            } else if (navigator.share) {
                this.nativeShareBtn.classList.remove('hidden');
            } else {
                this.nativeShareBtn.classList.add('hidden');
            }
        }

        if (this.modal) {
            this.modal.classList.remove('hidden');
        }
    }

    downloadCard() {
        if (!this.previewImg || !this.previewImg.src) return;
        const link = document.createElement('a');
        link.download = `rafometro_${Date.now()}.png`;
        link.href = this.previewImg.src;
        document.body.appendChild(link);
        link.click();
        link.remove();
        if (window.soundSystem) window.soundSystem.playClick();
    }

    async nativeShare() {
        if (!navigator.share || !this.currentBlob) return;

        try {
            const file = new File([this.currentBlob], 'rafometro_tarjeta.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: this.currentTitle,
                    text: this.currentText
                });
            } else {
                await navigator.share({
                    title: this.currentTitle,
                    text: this.currentText,
                    url: window.location.href
                });
            }
        } catch (err) {
            // El usuario canceló o error
            console.log('Share dismissed:', err);
        }
    }

    copyText() {
        if (!this.currentText) return;
        navigator.clipboard.writeText(this.currentText).then(() => {
            if (window.soundSystem) window.soundSystem.playClick();
            const original = this.copyShareTextBtn.innerHTML;
            this.copyShareTextBtn.innerHTML = '<span>✅ ¡Copiado!</span>';
            setTimeout(() => {
                this.copyShareTextBtn.innerHTML = original;
            }, 2000);
        });
    }

    // ==============================================================
    // GENERADORES DE TARJETAS (CANVAS 1080x1350 - Formato Instagram)
    // ==============================================================

    /**
     * Tarjeta del Analizador de Comentarios (Scouter)
     */
    async generateScouterCard(comment, metrics) {
        const width = 1080;
        const height = 1350;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 1. Fondo retro amarillo crema con bordes sólidos
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Cuadrícula retro
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // Marco grueso exterior estilo arcade
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 20;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // 2. Cabecera Retro
        ctx.fillStyle = '#facc15';
        ctx.fillRect(50, 50, width - 100, 150);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(50, 50, width - 100, 150);

        // Logo Rafaseñal en cabecera
        if (this.assets.emblem.complete) {
            ctx.drawImage(this.assets.emblem, 80, 75, 100, 100);
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = "900 46px 'Montserrat', sans-serif";
        ctx.fillText("EL RAFÓMETRO", 210, 125);
        ctx.font = "700 24px 'Montserrat', sans-serif";
        ctx.fillStyle = '#64748b';
        ctx.fillText("DETECTOR OFICIAL DE HATERS • @soyjennia", 210, 165);

        // 3. Tarjeta del Comentario Escaneado
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(80, 240, width - 160, 240);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(80, 240, width - 160, 240);

        ctx.fillStyle = '#64748b';
        ctx.font = "bold 24px 'Montserrat', sans-serif";
        ctx.fillText("COMENTARIO DETECTADO EN INSTAGRAM:", 110, 285);

        ctx.fillStyle = '#0f172a';
        ctx.font = "italic 700 32px 'Montserrat', sans-serif";
        this.wrapText(ctx, `"${comment}"`, 110, 340, width - 220, 44);

        // 4. Medidor de Poder Ki y Personaje (Rafamalo o Rafabueno)
        const isGood = metrics.percentage <= 25;
        const charImg = isGood ? this.assets.rafabueno : this.assets.rafamalo;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(80, 510, width - 160, 480);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(80, 510, width - 160, 480);

        // Dibujar Personaje
        if (charImg && charImg.complete) {
            ctx.drawImage(charImg, 110, 540, 260, 260);
        }

        // Título del Nivel
        ctx.fillStyle = '#0f172a';
        ctx.font = "900 28px 'Montserrat', sans-serif";
        ctx.fillText("NIVEL DE RAFA DETECTADO:", 400, 580);

        ctx.fillStyle = metrics.color || '#ef4444';
        ctx.font = "900 38px 'Montserrat', sans-serif";
        this.wrapText(ctx, metrics.title, 400, 640, width - 500, 46);

        // Porcentaje y Ki
        ctx.fillStyle = '#0f172a';
        ctx.font = "900 68px 'Montserrat', sans-serif";
        ctx.fillText(metrics.isOver9000 ? "+9000!" : `${metrics.percentage}%`, 400, 770);

        ctx.fillStyle = '#f59e0b';
        ctx.font = "800 36px 'Montserrat', sans-serif";
        ctx.fillText(`${metrics.kiNumber.toLocaleString()} KI`, 400, 825);

        // Barra de progreso Ki
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(110, 880, width - 220, 40);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
        ctx.strokeRect(110, 880, width - 220, 40);

        ctx.fillStyle = metrics.color || '#ef4444';
        const fillW = Math.min((metrics.percentage / 100) * (width - 220), width - 220);
        ctx.fillRect(113, 883, Math.max(fillW - 6, 0), 34);

        // 5. Sello de Aprobación de Corchito Canelón
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(80, 1020, width - 160, 190);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(80, 1020, width - 160, 190);

        if (this.assets.corchito.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(180, 1115, 60, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.assets.corchito, 120, 1055, 120, 120);
            ctx.restore();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(180, 1115, 60, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#92400e';
        ctx.font = "900 24px 'Montserrat', sans-serif";
        ctx.fillText("VEREDICTO DE CORCHITO CANELÓN 🐾", 270, 1080);

        ctx.fillStyle = '#0f172a';
        ctx.font = "600 22px 'Montserrat', sans-serif";
        this.wrapText(ctx, metrics.corchito, 270, 1125, width - 400, 32);

        // 6. Pie de página y llamado a la acción
        ctx.fillStyle = '#64748b';
        ctx.font = "bold 24px 'Montserrat', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText("Escaneá a tus propios haters en: rafometro.vercel.app ⚡🦇", width / 2, 1280);
        ctx.textAlign = 'left';

        // Exportar a DataURL y Blob
        const dataUrl = canvas.toDataURL('image/png');
        canvas.toBlob((blob) => {
            const shareText = `🔬 Escaneé este comentario en El Rafómetro (@soyjennia):\n` +
                `"${comment}"\n` +
                `📊 Nivel Rafa: ${metrics.percentage}%\n` +
                `⚡ Ki: ${metrics.kiNumber.toLocaleString()} KI\n` +
                `¡Escaneá a los tuyos en el link! ⚡🦇`;

            this.openModal(dataUrl, blob, "Veredicto del Rafómetro", shareText);
        }, 'image/png');
    }

    /**
     * Tarjeta de Récord del Arcade
     */
    async generateArcadeCard(score, revertedCount, playerName) {
        const width = 1080;
        const height = 1350;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Cuadrícula retro
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 20;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // Cabecera Arcade
        ctx.fillStyle = '#facc15';
        ctx.fillRect(50, 50, width - 100, 160);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(50, 50, width - 100, 160);

        ctx.fillStyle = '#0f172a';
        ctx.font = "900 48px 'Montserrat', sans-serif";
        ctx.fillText("🏆 RÉCORD EN EL ARCADE", 90, 120);
        ctx.font = "700 26px 'Montserrat', sans-serif";
        ctx.fillStyle = '#475569';
        ctx.fillText("EL RAYO ANTIRAFADOR 8-BIT • @soyjennia", 90, 170);

        // Tarjeta Central del Jugador
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(80, 250, width - 160, 480);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(80, 250, width - 160, 480);

        ctx.fillStyle = '#64748b';
        ctx.font = "bold 26px 'Montserrat', sans-serif";
        ctx.fillText("JUGADOR / CONVERTIDOR:", 120, 310);

        ctx.fillStyle = '#0f172a';
        ctx.font = "900 52px 'Montserrat', sans-serif";
        ctx.fillText(playerName.toUpperCase(), 120, 380);

        // Puntaje Grande
        ctx.fillStyle = '#f59e0b';
        ctx.font = "900 110px 'Montserrat', sans-serif";
        ctx.fillText(score.toLocaleString(), 120, 520);

        ctx.fillStyle = '#0f172a';
        ctx.font = "900 36px 'Montserrat', sans-serif";
        ctx.fillText("PUNTOS DE BUENA ONDA", 120, 580);

        // Stats inferiores
        ctx.fillStyle = '#10b981';
        ctx.font = "bold 34px 'Montserrat', sans-serif";
        ctx.fillText(`⚡ ${revertedCount} Rafas purificados con éxito`, 120, 650);

        // Ilustración de Rafabueno y Corchito
        ctx.fillStyle = '#ecfdf5';
        ctx.fillRect(80, 760, width - 160, 430);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(80, 760, width - 160, 430);

        // Título superior del veredicto con margen completo
        ctx.fillStyle = '#065f46';
        ctx.font = "900 34px 'Montserrat', sans-serif";
        ctx.fillText("¡CORCHITO CANELÓN TE FELICITA! 🐾", 120, 825);

        // Rafabueno a la izquierda
        if (this.assets.rafabueno.complete) {
            ctx.drawImage(this.assets.rafabueno, 120, 860, 190, 190);
        }

        // Corchito Canelón circular al centro
        if (this.assets.corchito.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(395, 955, 90, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.assets.corchito, 305, 865, 180, 180);
            ctx.restore();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(395, 955, 90, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Texto descriptivo a la derecha con margen seguro para no desbordar
        ctx.fillStyle = '#047857';
        ctx.font = "600 24px 'Montserrat', sans-serif";
        this.wrapText(ctx, "Lograste mantener a salvo a los perritos salchichas y purificaste el feed de Instagram con buena onda.", 520, 915, 430, 36);

        ctx.fillStyle = '#065f46';
        ctx.font = "bold 22px 'Montserrat', sans-serif";
        ctx.fillText("✨ Mención de Honor Antirafas", 520, 1045);

        // Pie de página
        ctx.fillStyle = '#64748b';
        ctx.font = "bold 24px 'Montserrat', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText("Jugá al Arcade en: rafometro.vercel.app 🎮🐾", width / 2, 1270);
        ctx.textAlign = 'left';

        const dataUrl = canvas.toDataURL('image/png');
        canvas.toBlob((blob) => {
            const shareText = `🎮 ¡Hice ${score.toLocaleString()} puntos en El Rayo Antirafador Arcade (@soyjennia)!\n` +
                `✨ Purifiqué ${revertedCount} Rafas y salvé a Corchito Canelón.\n` +
                `¿Podés superar mi récord en la tabla? 🏆⚡`;

            this.openModal(dataUrl, blob, "Récord en El Rafómetro Arcade", shareText);
        }, 'image/png');
    }

    /**
     * Tarjeta de Logro Desbloqueado
     */
    async generateAchievementCard(ach) {
        const width = 1080;
        const height = 1350;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 20;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // Cabecera
        ctx.fillStyle = '#facc15';
        ctx.fillRect(50, 50, width - 100, 160);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(50, 50, width - 100, 160);

        ctx.fillStyle = '#0f172a';
        ctx.font = "900 44px 'Montserrat', sans-serif";
        ctx.fillText("🎖️ LOGRO DESBLOQUEADO", 90, 120);
        ctx.font = "700 24px 'Montserrat', sans-serif";
        ctx.fillStyle = '#475569';
        ctx.fillText("EL RAFÓMETRO OFICIAL • @soyjennia", 90, 170);

        // Medalla central
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(80, 250, width - 160, 550);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(80, 250, width - 160, 550);

        ctx.font = "120px sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(ach.icon || "🏆", width / 2, 420);

        ctx.fillStyle = '#0f172a';
        ctx.font = "900 52px 'Montserrat', sans-serif";
        ctx.fillText(ach.title.toUpperCase(), width / 2, 530);

        ctx.fillStyle = '#64748b';
        ctx.font = "600 30px 'Montserrat', sans-serif";
        this.wrapText(ctx, ach.desc, width / 2 - 400, 610, 800, 42);

        // Certificación de Corchito
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(80, 830, width - 160, 350);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.strokeRect(80, 830, width - 160, 350);

        if (this.assets.corchito.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(220, 1005, 90, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.assets.corchito, 130, 915, 180, 180);
            ctx.restore();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(220, 1005, 90, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = '#92400e';
        ctx.font = "900 26px 'Montserrat', sans-serif";
        this.wrapText(ctx, "CERTIFICADO POR CORCHITO CANELÓN 🐾", 360, 960, width - 460, 34);

        ctx.fillStyle = '#0f172a';
        ctx.font = "600 24px 'Montserrat', sans-serif";
        this.wrapText(ctx, "Este usuario demostró su lealtad a la comunidad y su compromiso absoluto con la buena onda.", 360, 1015, width - 480, 36);

        ctx.fillStyle = '#64748b';
        ctx.font = "bold 24px 'Montserrat', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText("Desbloqueá tus logros en: rafometro.vercel.app ⚡🐾", width / 2, 1270);
        ctx.textAlign = 'left';

        const dataUrl = canvas.toDataURL('image/png');
        canvas.toBlob((blob) => {
            const shareText = `🏆 ¡Desbloqueé el logro '${ach.title}' en El Rafómetro (@soyjennia)!\n` +
                `${ach.icon} "${ach.desc}"\n` +
                `¿Te animás a desbloquear todos los trofeos? ⚡🐾`;

            this.openModal(dataUrl, blob, `Logro: ${ach.title}`, shareText);
        }, 'image/png');
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.storyCardGenerator = new StoryCardGenerator();
});
