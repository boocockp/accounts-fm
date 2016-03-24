'use strict';

class EventSequence extends DataSequence {

    constructor(element, eventName) {
        super();
        function onEvent(e) {
            e.preventDefault();
            this.add(e.target.value || Date.now());
        }

        $(element).on(eventName, onEvent.bind(this));

    }
}

class ClickInputSequence extends EventSequence {

    constructor(element) {
        super(element, 'click');
    }
}

class FormInputSequence extends DataSequence {

    constructor(element) {
        super();
        function onSubmit(e) {
            e.preventDefault();
            this.add(e.target.value);
        }

        $(element).on('submit', onSubmit.bind(this));

    }
}

class ChangeInputSequence extends DataSequence {

    constructor(element) {
        super();
        function onChange(e) {
            e.preventDefault();
            this.add(e.target.value);
        }

        $(element).on('change', onChange.bind(this));

    }
}

