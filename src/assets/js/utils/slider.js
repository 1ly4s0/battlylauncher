'use strict';

class Slider {
    constructor(id, minValue, maxValue) {
        this.slider = document.querySelector(id);
        this.touchLeft = this.slider.querySelector('.slider-touch-left');
        this.touchRight = this.slider.querySelector('.slider-touch-right');
        this.lineSpan = this.slider.querySelector('.slider-line span');

        this.min = parseFloat(this.slider.getAttribute('min'));
        this.max = parseFloat(this.slider.getAttribute('max'));
        this.step = parseFloat(this.slider.getAttribute('step')) || 0;

        if (minValue == null) minValue = this.min;
        if (maxValue == null) maxValue = this.max;

        this.minValue = minValue;
        this.maxValue = maxValue;

        this.normalizeFact = 18;

        this.startX = 0;
        this.x = 0;
        this.selectedTouch = null;

        this.func = {};

        this._computeMetrics();
        this.reset();
        this.setMinValue(this.minValue);
        this.setMaxValue(this.maxValue);

        this._bindPointer(this.touchLeft);
        this._bindPointer(this.touchRight);

        this._onResize = () => this.refresh();
        window.addEventListener('resize', this._onResize);

        this._ensureLayoutReady();
    }

    _pointerX(evt) {
        if (evt.touches && evt.touches.length) return evt.touches[0].pageX;
        if (evt.changedTouches && evt.changedTouches.length) return evt.changedTouches[0].pageX;
        return evt.pageX;
    }

    _bindPointer(elem) {
        const down = (e) => this.onStart(elem, e);
        elem.addEventListener('mousedown', down);
        elem.addEventListener('touchstart', down, { passive: false });
    }

    _computeMetrics() {

        const sliderW = this.slider.offsetWidth || 0;
        const knobW = this.touchLeft.offsetWidth || 0;

        this.usableWidth = Math.max(0, sliderW - knobW);
        this.maxX = Math.max(0, sliderW - (this.touchRight.offsetWidth || 0));

        this.initialValue = Math.max(1, this.usableWidth - this.normalizeFact);
    }

    _ensureLayoutReady(tries = 0) {
        if (this.slider.offsetWidth > 0) {

            this.refresh();
            return;
        }
        if (tries > 40) return;

        setTimeout(() => this._ensureLayoutReady(tries + 1), 50);
    }

    refresh(minValue = this.minValue, maxValue = this.maxValue) {

        this._computeMetrics();

        const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
        minValue = clamp(minValue, this.min, this.max);
        maxValue = clamp(maxValue, minValue, this.max);

        this.setMinValue(minValue);
        this.setMaxValue(maxValue);
        this.calculateValue();

    }

    reset() {

        const sliderW = this.slider.offsetWidth || 0;
        const knobW = this.touchLeft.offsetWidth || 0;

        this.touchLeft.style.left = '0px';
        this.touchRight.style.left = (Math.max(0, sliderW - knobW)) + 'px';

        this.lineSpan.style.marginLeft = '0px';
        this.lineSpan.style.width = (Math.max(0, sliderW - knobW)) + 'px';

        this.startX = 0;
        this.x = 0;
    }

    setMinValue(minValue) {
        const ratio = (minValue - this.min) / (this.max - this.min);
        const usable = Math.max(0, this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact));
        const leftPx = Math.ceil(ratio * usable);

        this.touchLeft.style.left = leftPx + 'px';
        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = (this.touchRight.offsetLeft - this.touchLeft.offsetLeft) + 'px';

        this.minValue = minValue;
    }

    setMaxValue(maxValue) {
        const ratio = (maxValue - this.min) / (this.max - this.min);
        const usable = Math.max(0, this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact));
        const rightPx = Math.ceil(ratio * usable + this.normalizeFact);

        this.touchRight.style.left = rightPx + 'px';
        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = (this.touchRight.offsetLeft - this.touchLeft.offsetLeft) + 'px';

        this.maxValue = maxValue;
    }

    onStart(elem, event) {
        event.preventDefault();

        this.selectedTouch = elem;
        this.x = this.selectedTouch.offsetLeft;
        this.startX = this._pointerX(event) - this.x;

        this._moveHandler = (e) => this.onMove(e);
        this._upHandler = (e) => this.onStop(e);

        document.addEventListener('mousemove', this._moveHandler);
        document.addEventListener('mouseup', this._upHandler);
        document.addEventListener('touchmove', this._moveHandler, { passive: false });
        document.addEventListener('touchend', this._upHandler);
    }

    onMove(event) {
        event.preventDefault();
        this.x = this._pointerX(event) - this.startX;

        const GAP = 24;

        if (this.selectedTouch === this.touchLeft) {

            const limit = this.touchRight.offsetLeft - this.selectedTouch.offsetWidth - GAP;
            if (this.x > limit) this.x = limit;
            if (this.x < 0) this.x = 0;
            this.selectedTouch.style.left = this.x + 'px';
        } else if (this.selectedTouch === this.touchRight) {

            const limit = this.touchLeft.offsetLeft + this.touchLeft.offsetWidth + GAP;
            if (this.x < limit) this.x = limit;
            if (this.x > this.maxX) this.x = this.maxX;
            this.selectedTouch.style.left = this.x + 'px';
        }

        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = (this.touchRight.offsetLeft - this.touchLeft.offsetLeft) + 'px';

        this.calculateValue();
    }

    onStop(event) {
        document.removeEventListener('mousemove', this._moveHandler);
        document.removeEventListener('mouseup', this._upHandler);
        document.removeEventListener('touchmove', this._moveHandler);
        document.removeEventListener('touchend', this._upHandler);

        this.selectedTouch = null;
        this.calculateValue();
    }

    calculateValue() {

        if (this.initialValue <= 0) {
            this._computeMetrics();
            if (this.initialValue <= 0) return;
        }

        const newWidth = (this.lineSpan.offsetWidth - this.normalizeFact);
        const newValue = newWidth / this.initialValue;
        const minValueN = (this.lineSpan.offsetLeft / this.initialValue);
        let minValue = minValueN * (this.max - this.min) + this.min;
        let maxValue = (minValueN + newValue) * (this.max - this.min) + this.min;

        const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

        if (this.step && this.step > 0) {
            const q = (v) => Math.floor(v / this.step) * this.step;
            minValue = q(minValue);
            maxValue = q(maxValue);
        }

        minValue = clamp(minValue, this.min, this.max);
        maxValue = clamp(maxValue, minValue, this.max);

        this.minValue = minValue;
        this.maxValue = maxValue;

        this.emit('change', this.minValue, this.maxValue);
    }

    on(name, func) {
        this.func[name] = func;
    }

    emit(name, ...args) {
        if (this.func[name]) this.func[name](...args);
    }
}

export default Slider;

