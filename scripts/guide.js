(function () {
    var KEY = 'app-guide-lang';

    function store(lang) {
        try { localStorage.setItem(KEY, lang); } catch (e) {}
    }

    function initial() {
        var p = new URLSearchParams(location.search).get('lang');
        if (p === 'cs' || p === 'en') { store(p); return p; }
        try {
            var s = localStorage.getItem(KEY);
            if (s === 'cs' || s === 'en') return s;
        } catch (e) {}
        return (navigator.language || '').toLowerCase().indexOf('cs') === 0 ? 'cs' : 'en';
    }

    function apply(lang) {
        document.querySelectorAll('.app-guide [data-lang]').forEach(function (el) {
            el.hidden = el.getAttribute('data-lang') !== lang;
        });
        document.querySelectorAll('.app-guide-lang button').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.value === lang));
        });
    }

    document.querySelectorAll('.app-guide-lang button').forEach(function (b) {
        b.addEventListener('click', function () { store(b.value); apply(b.value); });
    });

    apply(initial());
})();
