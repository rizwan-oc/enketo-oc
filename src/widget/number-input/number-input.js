import { t } from '../../js/fake-translator';
import Widget from '../../js/widget';

/** @type {WeakMap<HTMLInputElement, HTMLElement>} */
const questionsByInput = new WeakMap();

/**
 * @param {HTMLInputElement} input
 */
const getQuestion = (input) => {
    let question = questionsByInput.get(input);

    if (question == null) {
        question = input.closest('.question');

        if (question != null) {
            questionsByInput.set(input, question);
        }
    }

    return question;
};

/**
 * @abstract
 * @extends {Widget<HTMLInputElement>}
 */
class NumberInput extends Widget {
    /**
     * @abstract
     */
    static get selector() {
        throw new Error('Not implemented');
    }

    /**
     * @param {HTMLInputElemnt} input
     */
    static condition(input) {
        if (input.classList.contains('ignore')) {
            return false;
        }

        const isRange =
            input.hasAttribute('min') &&
            input.hasAttribute('max') &&
            input.hasAttribute('step');

        if (isRange) {
            return false;
        }

        const question = getQuestion(input);

        // analog-scale is included as a courtesy to OpenClinica
        return ![
            'or-appearance-analog-scale',
            'or-appearance-my-widget',
            'or-appearance-distress',
            'or-appearance-rating',
        ].some((className) => question.classList.contains(className));
    }

    static get languages() {
        throw new Error('Not implemented');
    }

    get language() {
        return this.languages[0] ?? navigator.language;
    }

    static get pattern() {
        throw new Error('Not implemented');
    }

    /**
     * @abstract
     * @type {RegExp}
     */
    static get characterPattern() {
        throw new Error('Not implemented');
    }

    get value() {
        return this.element.value;
    }

    set value(value) {
        this.element.value = value;
    }

    /**
     * @param {HTMLInputElement} input
     * @param {any} options
     */
    constructor(input, options) {
        super(input, options);

        const question = getQuestion(input);
        const message = document.createElement('div');

        message.classList.add('invalid-value-msg', 'active');

        question.append(message);

        this.question = question;
        this.message = message;

        this.setFormattedValue(input.valueAsNumber);
        this.setValidity();

        // TODO event delegation?
        input.addEventListener('keydown', (event) => {
            const { ctrlKey, isComposing, key, metaKey } = event;

            if (
                ctrlKey ||
                metaKey ||
                (key.length > 1 && key !== 'Spacebar') ||
                (!isComposing &&
                    this.constructor.characterPattern.test(event.key))
            ) {
                return true;
            }

            event.preventDefault();
            event.stopPropagation();
        });

        input.addEventListener('input', () => {
            this.setValidity();
        });
    }

    /**
     * @param {number} value
     */
    setFormattedValue(value) {
        const { pattern } = this.constructor;
        const { element } = this;

        element.removeAttribute('pattern');
        element.value = '';

        if (!Number.isNaN(value)) {
            element.value = value;
        }

        element.setAttribute('pattern', pattern.source);
    }

    setValidity() {
        const { element, message, question } = this;

        const isValid = element.checkValidity();

        question.classList.toggle('invalid-value', !isValid);
        message.innerText = isValid ? '' : t('constraint.invalid');
        this.isValid = isValid;
    }
}

export default NumberInput;
