describe('Cached Sequence', function() {

    let shouldFn = chai.should();
    let s;
    let changes;

    beforeEach(function() {
        s = new CachedSequence();
        changes = observedChanges(s);
    });

    function observedChanges(seq) {
        let changes = [];
        seq.onChange( v => changes.push(v));
        return changes;
    }

    describe('initialises', function() {

        it('to empty array by default', function() {
            s = new CachedSequence();
            s.value.should.eql([]);
            s.version.should.eql(0);
        });


        it('from array with version updated', function() {
            s = new CachedSequence([1, 2, 3]);
            s.value.should.eql([1, 2, 3]);
            s.version.should.eql(1);
        });

    });

    describe('notifies changes', function() {

        it('when observe empty', () => {
            changes.should.eql( [ [] ] );
        });

        it('from time when start to observe starting with current value', () => {
            s.add(1);
            s.add(2);
            let laterChanges = observedChanges(s);
            laterChanges.should.eql( [ [1, 2] ] );

            s.add(3);
            laterChanges.should.eql( [ [1, 2], [1, 2, 3] ] );
        });

        it('when add array', function() {

            s.add([1,2]);
            s.add([4]);

            changes.should.eql( [ [], [1,2], [1,2,4] ] );
            s.value.should.eql( [1,2,4] );
        });

        it('only when elements actually added', () => {
            s.add([1, 2]);
            s.add([]);
            s.add([3]);

            changes.should.eql( [ [], [1,2], [1,2,3] ] );
            s.version.should.eql(2);
        });

    });

});