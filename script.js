// Headlight comparison slider (only runs if the slider exists on this page)
(function(){
  const before = document.getElementById('beamBefore');
  const line = document.getElementById('dragLine');
  const handle = document.getElementById('dragHandle');
  const range = document.getElementById('beamRange');
  if(!before || !range) return;

  function update(val){
    before.style.clipPath = 'inset(0 ' + (100 - val) + '% 0 0)';
    if(line) line.style.left = val + '%';
    if(handle) handle.style.left = val + '%';
  }
  update(50);
  range.addEventListener('input', (e) => update(e.target.value));
})();

// Quote form: appointment picker + Netlify Forms AJAX submit
// (only runs if the form exists on this page)
(function(){
  const AVAILABILITY_URL = '/api/availability';
  const BOOK_URL = '/api/book-slot';

  const scheduler = document.getElementById('scheduler');
  const dateSelect = document.getElementById('qdate');
  const timeSelect = document.getElementById('qtime');
  const note = document.getElementById('schedNote');
  const defaultNote = note ? note.textContent : '';

  // Open slots grouped by day, as returned by /api/availability.
  let availableDays = [];

  function setNote(message, isWarning){
    if(!note) return;
    note.textContent = message || defaultNote;
    note.classList.toggle('warn', Boolean(isWarning));
  }

  function dayFor(date){
    return availableDays.find((day) => day.date === date);
  }

  function renderTimes(){
    if(!dateSelect || !timeSelect) return;
    const day = dayFor(dateSelect.value);
    timeSelect.innerHTML = '';

    if(!day){
      timeSelect.appendChild(new Option('Any time', ''));
      timeSelect.disabled = true;
      return;
    }

    timeSelect.appendChild(new Option('Pick a time', ''));
    day.slots.forEach((slot) => {
      timeSelect.appendChild(new Option(slot.label, String(slot.hour)));
    });
    timeSelect.disabled = false;
  }

  function renderDays(){
    if(!dateSelect) return;
    const previousDate = dateSelect.value;
    const previousHour = timeSelect ? timeSelect.value : '';

    dateSelect.innerHTML = '';
    dateSelect.appendChild(new Option('No date preference', ''));
    availableDays.forEach((day) => {
      dateSelect.appendChild(new Option(day.label, day.date));
    });

    // Keep the visitor's choice when it survived a refresh.
    const stillOpen = dayFor(previousDate);
    dateSelect.value = stillOpen ? previousDate : '';
    renderTimes();
    if(stillOpen && previousHour && stillOpen.slots.some((slot) => String(slot.hour) === previousHour)){
      timeSelect.value = previousHour;
    }
  }

  async function loadAvailability(){
    if(!scheduler) return;
    try {
      const response = await fetch(AVAILABILITY_URL, { headers: { Accept: 'application/json' } });
      if(!response.ok) throw new Error('availability lookup failed');
      const data = await response.json();
      availableDays = Array.isArray(data.days) ? data.days : [];
    } catch (err) {
      availableDays = [];
    }

    // No schedule to show? Leave the picker out of the way — the form still works.
    if(availableDays.length === 0){
      scheduler.hidden = true;
      return;
    }
    renderDays();
    scheduler.hidden = false;
  }

  function selectedSlot(){
    if(!scheduler || scheduler.hidden || !dateSelect || !timeSelect) return null;
    const date = dateSelect.value;
    const hour = timeSelect.value;
    if(!date || hour === '') return null;
    return { date: date, hour: Number(hour) };
  }

  function encodeForm(data){
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
      .join('&');
  }

  // Reserves the chosen slot before the lead is sent, so two visitors can never
  // walk away believing they both own the same hour.
  async function reserveSlot(slot, payload){
    const response = await fetch(BOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: slot.date,
        hour: slot.hour,
        name: payload.name,
        phone: payload.phone,
        zip: payload.zip,
        service: payload.service,
        notes: payload.notes
      })
    });

    if(response.status === 409){
      const conflict = await response.json().catch(() => ({}));
      if(Array.isArray(conflict.days)){
        availableDays = conflict.days;
        renderDays();
      }
      return { taken: true, message: conflict.message || 'That time was just taken. Please pick another one.' };
    }

    if(!response.ok) return { unconfirmed: true };

    const booked = await response.json().catch(() => ({}));
    return { appointment: booked.appointment };
  }

  async function handleQuoteSubmit(event){
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('.form-submit');
    const errorBox = document.getElementById('formError');
    const okBox = document.getElementById('formOk');
    const originalLabel = button.textContent;

    if(errorBox) errorBox.style.display = 'none';
    if(okBox) okBox.style.display = 'none';
    setNote('');

    const payload = {};
    new FormData(form).forEach((value, key) => { payload[key] = value; });

    const slot = selectedSlot();
    button.textContent = 'Sending…';
    button.disabled = true;

    try {
      let confirmation = '';

      if(slot){
        const result = await reserveSlot(slot, payload);
        if(result.taken){
          setNote(result.message, true);
          button.textContent = originalLabel;
          button.disabled = false;
          return;
        }
        if(result.unconfirmed){
          // Booking service is unreachable — still send the lead, flagged as unconfirmed.
          const day = dayFor(slot.date);
          const slotLabel = day && day.slots.find((s) => s.hour === slot.hour);
          payload.appointment = (day ? day.label : slot.date) + ' · ' +
            (slotLabel ? slotLabel.label : slot.hour + ':00') + ' (requested — needs confirmation)';
          confirmation = 'Request received. We\'ll text you to confirm your appointment time.';
        } else {
          payload.appointment = result.appointment + ' (booked)';
          confirmation = 'You\'re booked for <strong>' + result.appointment + '</strong>. We\'ll text you a confirmation.';
        }
      } else {
        payload.appointment = 'No preference — call to schedule';
        confirmation = 'Request received. We\'ll text you back to schedule a time.';
      }

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeForm(payload)
      });
      if(!response.ok) throw new Error('form submission failed');

      button.textContent = 'Request received ✓';
      button.style.background = '#7fae6f';
      if(okBox){
        okBox.innerHTML = confirmation;
        okBox.style.display = 'block';
      }

      setTimeout(() => {
        button.textContent = originalLabel;
        button.style.background = '';
        button.disabled = false;
        form.reset();
        renderTimes();
        loadAvailability();
      }, 3200);
    } catch (err) {
      button.textContent = originalLabel;
      button.disabled = false;
      if(errorBox) errorBox.style.display = 'block';
    }
  }

  const form = document.querySelector('form.quote-form');
  if(!form) return;

  form.addEventListener('submit', handleQuoteSubmit);
  if(dateSelect) dateSelect.addEventListener('change', () => { setNote(''); renderTimes(); });
  if(timeSelect) timeSelect.addEventListener('change', () => setNote(''));

  if(scheduler) loadAvailability();
})();
