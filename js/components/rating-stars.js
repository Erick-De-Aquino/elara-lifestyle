(function () {

    const TEXTOS = {
        0: 'Selecciona una valoración',
        1: 'Muy mala',
        2: 'Mejorable',
        3: 'Buena',
        4: 'Muy buena',
        5: 'Excelente'
    };

    const SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5l2.93 5.94 6.56.95-4.74 4.62 1.12 6.53L12 17.77l-5.87 3.08 1.12-6.53L2.5 9.39l6.57-.95L12 2.5z"/>
    </svg>`;

    function create({ container, value = 0, onChange = null }) {

        let current = value;

        container.innerHTML = `
            <div class="rating-stars"></div>
            <div class="rating-text"></div>
        `;

        const stars = container.querySelector('.rating-stars');
        const text = container.querySelector('.rating-text');

        function pintar(valor) {

            stars.querySelectorAll('.rating-star').forEach((star, i) => {
                star.classList.toggle('active', i < valor);
            });

            text.textContent =
                valor === 0
                    ? TEXTOS[0]
                    : `${TEXTOS[valor]} (${valor}/5)`;
        }

        for (let i = 1; i <= 5; i++) {

            const star = document.createElement('button');

            star.type = 'button';
            star.className = 'rating-star';
            star.dataset.value = i;
            star.innerHTML = SVG;

            star.addEventListener('mouseenter', () => pintar(i));

            star.addEventListener('mouseleave', () => pintar(current));

            star.addEventListener('click', () => {

                current = i;

                pintar(current);

                onChange?.(current);

            });

            stars.appendChild(star);

        }

        pintar(current);

        return {

            getValue() {
                return current;
            },

            setValue(v) {
                current = v;
                pintar(v);
            }

        };

    }

    window.RatingStars = { create };

})();