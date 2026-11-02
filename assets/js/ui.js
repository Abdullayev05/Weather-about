// --- SÜRÜŞDÜRMƏ MEXANİZMİ ---
    const slider = container;
    
    if (!slider.dataset.listenerAdded) {
        slider.dataset.listenerAdded = "true";

        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.clientX - slider.getBoundingClientRect().left;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.clientX - slider.getBoundingClientRect().left;
            const walk = (x - startX) * 2; // Sürüşdürmə həssaslığı
            slider.scrollLeft = scrollLeft - walk;
        });
    }

    