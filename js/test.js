/**
 * El Test del Rafa - Cuestionario Interactivo Retro Gamer
 * Mide el nivel de hater interior con referencias a Corchito Canelón, Kick, YouTube e Instagram.
 */

class RafaTest {
    constructor() {
        this.questions = [
            {
                id: 1,
                question: "1. Ves a un creador de contenido que sube historias desde la playa un martes a las 11 AM:",
                options: [
                    { text: "Me alegro por esa persona, ojalá la esté pasando de diez.", points: 0 },
                    { text: "Paso de largo la historia, no me cambia el día.", points: 5 },
                    { text: "Pienso para mis adentros: 'Seguro es todo canje o vive de los demás'.", points: 15 },
                    { text: "Le respondo la historia: 'Qué lindo vivir de vacaciones mientras los giles laburamos'.", points: 25 }
                ]
            },
            {
                id: 2,
                question: "2. Aparece Corchito Canelón (el perro salchicha de Jennia) con su mirada tierna en una foto:",
                options: [
                    { text: "¡Me muero de amor! Es el salchicha más noble y guardián de la galaxia.", points: 0 },
                    { text: "Le doy un like rápido, los perritos siempre suman.", points: 3 },
                    { text: "Pienso: 'Uf, sube fotos del perro para juntar likes'.", points: 18 },
                    { text: "Comento: 'Ese salchicha seguro come mejor que yo, qué país injusto'.", points: 25 }
                ]
            },
            {
                id: 3,
                question: "3. Kakarotta prende stream en Kick o sube nuevo vlog en YouTube sobre Buenos Aires:",
                options: [
                    { text: "Me preparo un mate, entro al stream a charlar y tirar buena onda.", points: 0 },
                    { text: "Si tengo tiempo lo miro, si no lo dejo para después.", points: 5 },
                    { text: "Entro 2 minutos solo para ver si hay bardo o cuántos viewers tiene.", points: 15 },
                    { text: "Spameo en el chat que 'antes era más humilde' y me banearon con razón.", points: 25 }
                ]
            },
            {
                id: 4,
                question: "4. Una cuenta que te cae mal sube 45 historias seguidas con puntitos diminutos:",
                options: [
                    { text: "Dejo de seguirla o la silencio sin hacer drama, mi salud mental es primero.", points: 0 },
                    { text: "Miro un par para ver de qué va y las salteo.", points: 5 },
                    { text: "Me clavo las 45 historias completas con cara de indignación.", points: 18 },
                    { text: "Miro todo, saco capturas para mandarlas a 3 grupos y le tiro un palo por privado.", points: 25 }
                ]
            },
            {
                id: 5,
                question: "5. Alguien se queja en redes con la frase 'FALSA HUMILDAD':",
                options: [
                    { text: "Me río porque sé que es un Rafa clásico detectado por el Scouter.", points: 0 },
                    { text: "Ignoro la queja, cada uno con su rollo.", points: 5 },
                    { text: "A veces pienso que tienen un punto...", points: 15 },
                    { text: "Esa frase es mi bandera y mi credo matutino en comentarios de Instagram.", points: 25 }
                ]
            },
            {
                id: 6,
                question: "6. Aparece la RAFASEÑAL en el cielo (Ralph Gorgory con orejas de Batman en amarillo y negro):",
                options: [
                    { text: "¡Llamo a Corchito Canelón y activo el Rayo Antirafador para defender las buenas vibras!", points: 0 },
                    { text: "Me río del meme, es una obra maestra de la comunidad.", points: 2 },
                    { text: "Siento un frío en la espalda porque el rayo me puede dar a mí.", points: 15 },
                    { text: "Pido hablar con el administrador de Ciudad Gótica para denunciar polución visual.", points: 25 }
                ]
            }
        ];

        this.currentIndex = 0;
        this.totalScore = 0;

        // Elementos DOM
        this.quizContainer = document.getElementById('quizContainer');
        this.questionText = document.getElementById('quizQuestionText');
        this.optionsContainer = document.getElementById('quizOptionsContainer');
        this.quizProgress = document.getElementById('quizProgressBar');
        this.quizCounter = document.getElementById('quizCounter');
        this.quizResultBox = document.getElementById('quizResultBox');
        this.quizBadge = document.getElementById('quizBadge');
        this.quizResultTitle = document.getElementById('quizResultTitle');
        this.quizScoreText = document.getElementById('quizScoreText');
        this.quizResultDesc = document.getElementById('quizResultDesc');
        this.quizPrescription = document.getElementById('quizPrescription');
        this.restartBtn = document.getElementById('restartQuizBtn');
        this.shareQuizBtn = document.getElementById('shareQuizBtn');

        this.init();
    }

    init() {
        if (!this.quizContainer) return;

        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.restart());
        }

        if (this.shareQuizBtn) {
            this.shareQuizBtn.addEventListener('click', () => this.shareResult());
        }

        this.showQuestion(0);
    }

    showQuestion(index) {
        if (index >= this.questions.length) {
            this.finishQuiz();
            return;
        }

        this.currentIndex = index;
        const currentQ = this.questions[index];

        if (this.quizCounter) {
            this.quizCounter.textContent = `NIVEL ${index + 1} / ${this.questions.length}`;
        }
        if (this.quizProgress) {
            const percentage = ((index) / this.questions.length) * 100;
            this.quizProgress.style.width = `${percentage}%`;
        }

        if (this.questionText) {
            this.questionText.textContent = currentQ.question;
        }

        if (this.optionsContainer) {
            this.optionsContainer.innerHTML = '';
            currentQ.options.forEach((opt, optIndex) => {
                const button = document.createElement('button');
                button.className = "w-full text-left p-3.5 rounded-xl border-2 border-slate-900 bg-white hover:bg-yellow-100 hover:border-black transition-all flex items-center space-x-3 shadow-[2px_2px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none group";
                button.innerHTML = `
                    <span class="w-8 h-8 rounded-lg bg-yellow-400 border-2 border-slate-900 flex items-center justify-center font-pixel text-xs text-black group-hover:bg-black group-hover:text-yellow-400 transition-colors">
                        ${String.fromCharCode(65 + optIndex)}
                    </span>
                    <span class="text-slate-900 flex-1 text-sm md:text-base font-semibold">
                        ${opt.text}
                    </span>
                `;

                button.addEventListener('click', () => {
                    this.selectOption(opt.points);
                });

                this.optionsContainer.appendChild(button);
            });
        }
    }

    selectOption(points) {
        if (window.soundSystem) {
            window.soundSystem.playClick();
        }

        this.totalScore += points;
        this.currentIndex++;

        if (this.currentIndex < this.questions.length) {
            this.showQuestion(this.currentIndex);
        } else {
            this.finishQuiz();
        }
    }

    finishQuiz() {
        if (this.quizProgress) {
            this.quizProgress.style.width = '100%';
        }

        this.quizContainer.classList.add('hidden');
        this.quizResultBox.classList.remove('hidden');

        const maxPoints = 150;
        const normalized = Math.min(Math.round((this.totalScore / maxPoints) * 100), 100);

        let resultData = {};

        if (normalized <= 15) {
            resultData = {
                badge: '🛡️ COMPAÑERO DE ORO & AMIGO DE CORCHITO',
                title: '¡0% RAFA! ALMA PURA Y BUENA ONDA',
                badgeClass: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-600',
                desc: '¡Sos un ser de luz! No conoces la envidia, te alegrás de corazón con los logros ajenos y Corchito Canelón te dejaría rascarle la panza sin dudarlo ni un segundo. Pertenecés a la élite de la comunidad.',
                prescription: 'Prescripción: Mantener ese corazón generoso. Te ganaste un mate caliente y un asiento de honor en el próximo stream.'
            };
        } else if (normalized <= 40) {
            resultData = {
                badge: '👀 RAFA CURIOSO / EN DUDA',
                title: 'TRAZAS LEVES DE RAFA (CONTROLABLE)',
                badgeClass: 'bg-blue-100 text-blue-800 border-2 border-blue-600',
                desc: 'A veces te gana el morbo de mirar alguna historia que te da cringe o ponés cara de desconfiado con algún canje, pero no tirás veneno. Tu lado hater está dormido.',
                prescription: 'Prescripción: Si sentís ganas de escribir \'falsa humildad\', mirá una foto de Corchito Canelón durmiendo y respirá hondo.'
            };
        } else if (normalized <= 75) {
            resultData = {
                badge: '⚠️ RAFA EN FASE DE INCUBACIÓN',
                title: 'PELIGRO: SÍNTOMAS DE HATER EN ASCENSO',
                badgeClass: 'bg-amber-100 text-amber-900 border-2 border-amber-600',
                desc: 'Tenés la pestaña de Instagram abierta para indignarte. Ya usaste alguna vez frases de manual como \'con la mía viajás\' o \'dejá de figurar\'. Estás a un paso del baneo cósmico.',
                prescription: 'Prescripción: Sesión urgente con el Rayo Antirafador en el minijuego para desintoxicarte de inmediato.'
            };
        } else {
            resultData = {
                badge: '🚨 RAFA SUPREMO CLASE S - INTOXICACIÓN SEVERA',
                title: '¡ALERTA ROJA! RAFA PELIGROSO',
                badgeClass: 'bg-red-100 text-red-900 border-2 border-red-600',
                desc: '¡Emergencia total! Vivís enojado con el mundo digital. Si alguien sonríe decís que es fingido, si Corchito Canelón mueve la cola decís que busca views. La Rafaseñal en el cielo se encendió pura y exclusivamente por tu culpa.',
                prescription: 'Prescripción: Apagar el celular, salir a caminar descalzo por el pasto y pedirle perdón a Ralph Gorgory.'
            };
        }

        this.quizBadge.className = `inline-flex items-center px-4 py-1.5 rounded-full text-xs md:text-sm font-bold ${resultData.badgeClass}`;
        this.quizBadge.textContent = resultData.badge;
        this.quizResultTitle.textContent = resultData.title;
        this.quizScoreText.textContent = `Índice de Rafa: ${normalized}%`;
        this.quizResultDesc.textContent = resultData.desc;
        this.quizPrescription.innerHTML = `<strong>🩺 Tratamiento:</strong> ${resultData.prescription}`;

        this.currentResult = {
            title: resultData.title,
            badge: resultData.badge,
            score: normalized
        };

        if (window.soundSystem) {
            if (normalized <= 40) {
                window.soundSystem.playFanfare();
            } else {
                window.soundSystem.playAlert();
            }
        }

        this.quizResultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    restart() {
        if (window.soundSystem) window.soundSystem.playClick();
        this.currentIndex = 0;
        this.totalScore = 0;
        this.quizResultBox.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');
        this.showQuestion(0);
    }

    shareResult() {
        if (!this.currentResult) return;

        const shareText = `🧪 Test Oficial de El Rafómetro (@soyjennia):\n` +
            `🏷️ Mi Diagnóstico: ${this.currentResult.badge}\n` +
            `📊 Índice de Rafa: ${this.currentResult.score}%\n\n` +
            `¿Sos un hater de clóset o amigo de Corchito Canelón? ⚡🦇 Descubrilo en El Rafómetro!`;

        navigator.clipboard.writeText(shareText).then(() => {
            if (window.soundSystem) window.soundSystem.playClick();
            const originalText = this.shareQuizBtn.innerHTML;
            this.shareQuizBtn.innerHTML = `<span>✅ ¡Copiado con Éxito!</span>`;
            setTimeout(() => {
                this.shareQuizBtn.innerHTML = originalText;
            }, 2000);
        }).catch(() => {
            alert('Copiado no disponible.');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.rafaTest = new RafaTest();
});
