describe('DataSequence', function() {

    let shouldFn = chai.should();
    let s;

    function observedChanges(seq) {
        let changes = [];
        seq.onChange( v => changes.push(v));
        return changes;
    }

    beforeEach(function() {
        s = new DataSequence();
    });

    it('is initialised', function() {
        shouldFn.not.exist(s.value);
        s.version.should.eql(0);
    });

    it('adds elements and updates version', function() {
        s.add('Fred');
        s.value.should.eql('Fred');
        s.version.should.eql(1);
    });

    it('adds elements and notifies each time', function() {
        let changes = observedChanges(s);

        s.add(22);
        changes.should.eql([22]);
        s.value.should.eql(22);

        s.add(33);
        changes.should.eql([22, 33]);
        s.value.should.eql(33);

        s.add(33);
        changes.should.eql([22, 33, 33]);
        s.value.should.eql(33);
    });

    it('adds elements with mapping and notifies each time unless result is undefined', function() {
        let m = s.map( v => v != 99 ? v + 1 : undefined );
        let changes = observedChanges(m);

        s.add(22);
        changes.should.eql([23]);
        m.value.should.eql(23);

        s.add(33);
        changes.should.eql([23, 34]);
        m.value.should.eql(34);

        s.add(33);
        changes.should.eql([23, 34, 34]);
        m.value.should.eql(34);

        let mVersion = m.version;
        s.add(99);
        changes.should.eql([23, 34, 34]);
        m.value.should.eql(34);
        m.version.should.eql(mVersion);
    });

    it('adds elements with filter and notifies each time', function() {
        let f = s.filter( v => v >= 30 );
        let changes = observedChanges(f);

        s.add(30);
        changes.should.eql([30]);
        f.value.should.eql(30);

        s.add(20);
        changes.should.eql([30]);
        f.value.should.eql(30);

        s.add(33);
        changes.should.eql([30, 33]);
        f.value.should.eql(33);
    });

    it('merges two sequences and notifies each time', function() {
        let t = new DataSequence();
        let m = s.merge(t);
        let changes = observedChanges(m);

        s.add(22);
        changes.should.eql([22]);
        m.value.should.eql(22);

        t.add(33);
        changes.should.eql([22, 33]);
        m.value.should.eql(33);

        s.add(33);
        changes.should.eql([22, 33, 33]);
        m.value.should.eql(33);
    });


    it('combines two sequences and notifies on each change after both have a value', function() {
        let t = new DataSequence();
        let c = s.combine(t, (a, b) => a + b);
        let changes = observedChanges(c);

        s.add(22);
        changes.should.eql([]);
        shouldFn.not.exist(c.value);

        t.add(33);
        changes.should.eql([55]);
        c.value.should.eql(55);

        s.add(33);
        changes.should.eql([55, 66]);
        c.value.should.eql(66);

        s.add(11);
        changes.should.eql([55, 66, 44]);
        c.value.should.eql(44);
    });

    it('maps a sequence to two sequences then combines them and notifies correct changes to two observers', function() {
        let m1 = s.map( v => v + 1 );
        let m2 = s.map( v => v * 10 );
        let c = m1.combine(m2, (a, b) => a + b);
        let changes = observedChanges(c);
        let changes2 = observedChanges(c);

        s.add(10);
        changes.should.eql([111]);
        changes2.should.eql([111]);
        c.value.should.eql(111);

        s.add(20);
        changes.should.eql([111, 221]);
        changes2.should.eql([111, 221]);
        c.value.should.eql(221);
    });

});