document.addEventListener('DOMContentLoaded', () => {

    const motoresDeReserva = {
        'DoubleTree by Hilton Foz': 'https://www.letsatlantica.com.br/hotel/doubletree-by-hilton-foz-do-iguacu',
        'Viale Tower': 'https://book.omnibees.com/chain/1557?q=3398',
        'Viale Cataratas': 'https://book.omnibees.com/chain/1557?q=2510',
        'Viale Iguassu': 'https://book.omnibees.com/chain/1557?q=13102',
        'JK Premium': 'https://book.omnibees.com/hotelresults?c=11521&q=21694&currencyId=16&lang=pt-BR'
    };
    
    const bookingState = {
        destination: '',
        destinationLink: '',
        checkIn: null,
        checkOut: null,
        adults: 2,
        children: 0
    };

    const fields = {
        destination: document.getElementById('field-destination'),
        period: document.getElementById('field-period'),
        people: document.getElementById('field-people'),
    };

    const popups = {
        destination: document.getElementById('popup-destination'),
        people: document.getElementById('popup-people'),
    };

    const closeAllPopups = () => {
        Object.values(popups).forEach(p => p && p.classList.remove('active'));
        Object.values(fields).forEach(f => f && f.classList.remove('active'));
    };

    const openPopup = (popup, field) => {
        if (!popup || !field) return;
        const isAlreadyActive = field.classList.contains('active');
        closeAllPopups();
        if (!isAlreadyActive) {
            popup.classList.add('active');
            field.classList.add('active');
        }
    };

    fields.destination?.addEventListener('click', (e) => {
        e.stopPropagation();
        openPopup(popups.destination, fields.destination);
    });

    fields.people?.addEventListener('click', (e) => {
        e.stopPropagation();
        openPopup(popups.people, fields.people);
    });

    document.querySelectorAll('.popup-close-btn').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllPopups();
    }));

    document.addEventListener('click', (e) => {
        const container = document.getElementById('booking-widget-container');
        if (container && !container.contains(e.target)) {
            closeAllPopups();
        }
    });
    
    document.querySelectorAll('#popup-destination .destination-option').forEach(option => {
        option.addEventListener('click', () => {
            const destinationName = option.dataset.value;
            bookingState.destination = destinationName;
            bookingState.destinationLink = motoresDeReserva[destinationName] || '';
            document.getElementById('text-destination').innerHTML = `<span class="value">${bookingState.destination}</span>`;
            closeAllPopups();
        });
    });

    const updatePeopleDisplay = () => {
        const textPeople = document.getElementById('text-people');
        if (!textPeople) return;
        const { adults, children } = bookingState;
        const peopleText = `${adults} Adulto(s)` + (children > 0 ? `, ${children} Criança(s)` : '');
        textPeople.innerHTML = `<span class="value">${peopleText}</span>`;
        
        const minusAdultsBtn = document.querySelector('.pax-btn[data-type="adults"][data-action="minus"]');
        if(minusAdultsBtn) minusAdultsBtn.disabled = adults <= 1;

        const minusChildrenBtn = document.querySelector('.pax-btn[data-type="children"][data-action="minus"]');
        if(minusChildrenBtn) minusChildrenBtn.disabled = children <= 0;
    };
    
    document.querySelectorAll('.pax-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.dataset.type;
            const action = btn.dataset.action;
            if (type === 'adults') {
                bookingState.adults = Math.max(1, bookingState.adults + (action === 'plus' ? 1 : -1));
            } else {
                bookingState.children = Math.max(0, bookingState.children + (action === 'plus' ? 1 : -1));
            }
            document.getElementById(`${type}-value`).textContent = bookingState[type];
            updatePeopleDisplay();
        });
    });

    if (fields.period) {
        flatpickr(fields.period, {
            mode: "range",
            dateFormat: "d/m/Y",
            minDate: "today",
            locale: "pt",
            onOpen: () => { closeAllPopups(); fields.period.classList.add('active'); },
            onClose: () => fields.period.classList.remove('active'),
            onChange: (selectedDates, dateStr, instance) => {
                if (selectedDates.length === 2) {
                    bookingState.checkIn = selectedDates[0];
                    bookingState.checkOut = selectedDates[1];
                    const dateText = `${instance.formatDate(bookingState.checkIn, "d/m")} - ${instance.formatDate(bookingState.checkOut, "d/m/Y")}`;
                    document.getElementById('text-period').innerHTML = `<span class="value">${dateText}</span>`;
                    instance.close();
                }
            }
        });
    }
    
    document.getElementById('mainBookingForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!bookingState.destination) { alert('Por favor, selecione o seu hotel de destino.'); openPopup(popups.destination, fields.destination); return; }
        if (!bookingState.checkIn) { alert('Por favor, selecione a data de check-in e check-out.'); fields.period?._flatpickr.open(); return; }
        
        const finalUrl = bookingState.destinationLink;

        if (finalUrl) {
            if (bookingState.destination === 'DoubleTree by Hilton Foz') {
                window.open(finalUrl, '_blank');
                return;
            }
            try {
                let urlComParametros = new URL(finalUrl);
                if (finalUrl.includes('omnibees.com')) {
                    const formatOmnibees = (date) => `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
                    urlComParametros.searchParams.set('CheckIn', formatOmnibees(bookingState.checkIn));
                    urlComParametros.searchParams.set('CheckOut', formatOmnibees(bookingState.checkOut));
                    urlComParametros.searchParams.set('ad', bookingState.adults);
                    urlComParametros.searchParams.set('ch', bookingState.children);
                    urlComParametros.searchParams.set('NRooms', 1);
                }
                window.open(urlComParametros.href, '_blank');
            } catch(e) { console.error("URL inválida:", finalUrl); alert("Ocorreu um erro ao construir o link de reserva."); }
        } else { alert('O link de reserva para este hotel ainda não foi configurado.'); }
    });
    
    document.querySelectorAll('.btn-reserve').forEach(button => {
        button.addEventListener('click', () => {
            const hotelName = button.getAttribute('data-hotel');
            const destinationOption = document.querySelector(`.destination-option[data-value="${hotelName}"]`);
            if (destinationOption) {
                destinationOption.click();
                document.getElementById('booking-widget-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    // --- LÓGICA DOS CARROSSEIS ---
    const photoCarousel = document.querySelector('#photos-carousel .carousel-track');
    if (photoCarousel) {
        const slides = Array.from(photoCarousel.children);
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        if (slides.length > 0) {
            let currentIndex = 0;
            const moveToSlide = (index) => {
                const slideWidth = slides[0].offsetWidth + parseInt(getComputedStyle(photoCarousel).gap);
                photoCarousel.style.transform = `translateX(-${slideWidth * index}px)`;
                currentIndex = index;
                prevBtn.disabled = currentIndex === 0;
                nextBtn.disabled = currentIndex === slides.length - 1;
            };

            nextBtn?.addEventListener('click', () => {
                if (currentIndex < slides.length - 1) {
                    moveToSlide(currentIndex + 1);
                }
            });
            prevBtn?.addEventListener('click', () => {
                if (currentIndex > 0) {
                    moveToSlide(currentIndex - 1);
                }
            });
            
            window.addEventListener('resize', () => {
                // Reseta para o início para evitar quebra de layout ao redimensionar
                moveToSlide(0);
            });
            moveToSlide(0); // Initialize
        }
    }

    const testimonialTrack = document.querySelector('.testimonial-slider-track');
    if (testimonialTrack) {
        const slides = Array.from(testimonialTrack.children);
        const nextButton = document.getElementById('testimonial-next');
        const prevButton = document.getElementById('testimonial-prev');
        if (slides.length > 0) {
            let currentIndex = 0;
            const moveToSlide = (index) => {
                const slideWidth = slides[0].getBoundingClientRect().width;
                testimonialTrack.style.transform = `translateX(-${slideWidth * index}px)`;
                currentIndex = index;
                prevButton.disabled = currentIndex === 0;
                nextButton.disabled = currentIndex === slides.length - 1;
            };
            nextButton?.addEventListener('click', () => { if(currentIndex < slides.length - 1) moveToSlide(currentIndex + 1) });
            prevButton?.addEventListener('click', () => { if(currentIndex > 0) moveToSlide(currentIndex - 1) });
            moveToSlide(0);
        }
    }
    
    updatePeopleDisplay();
});