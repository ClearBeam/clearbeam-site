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

// Quote form → Netlify Forms AJAX submit (only runs if the form exists on this page)
function encodeForm(data){
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
}

function handleQuoteSubmit(e){
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('.form-submit');
  const errorBox = document.getElementById('formError');
  const original = btn.dataset.label || btn.textContent;
  btn.dataset.label = original;

  const formData = new FormData(form);
  const payload = {};
  formData.forEach((value, key) => { payload[key] = value; });

  // Netlify matches submissions to the form by this field; without it the POST is rejected.
  payload['form-name'] = form.getAttribute('name');

  btn.textContent = 'Sending…';
  btn.disabled = true;
  if(errorBox) errorBox.style.display = 'none';

  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodeForm(payload)
  })
    .then((response) => {
      // A non-2xx here means Netlify did not record the request — never show success for it.
      if(!response.ok) throw new Error('Form POST failed with status ' + response.status);
      btn.textContent = 'Request received ✓';
      btn.style.background = '#7fae6f';
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
        form.reset();
      }, 2600);
    })
    .catch((err) => {
      console.error('Quote request was not delivered:', err);
      btn.textContent = original;
      btn.disabled = false;
      if(errorBox) errorBox.style.display = 'block';
    });

  return false;
}
