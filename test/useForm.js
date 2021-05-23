import React, { useState, useMemo, useEffect, useRef } from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { useForm, defValidation, makeForm } from '../src';

import { Input, Checkbox } from './components';

describe('useForm', () => {
  before(() => {
    // one-time definition of global validations to be used in tests bellow
    defValidation('presence', (value, { message }) => {
      if (!value || (Array.isArray(value) && !value.length)) {
        return message || "Can't be empty";
      }
    });

    defValidation('numericality', (value, { lessThan, lessThanMessage }) => {
      if (!value) return;

      if (+value >= lessThan) {
        return lessThanMessage || `Should be less than ${lessThan}`;
      }
    });
  });

  function Form() {
    const { $, reset, isBar, isPristine } = useForm({
      initial: { foo: 'foo' },
      helpers: ({ attrs }) => ({ isBar: attrs.foo === 'bar' })
    });

    return (
      <div>
        <Input {...$('foo')} className="foo" />
        <Input {...$('bar')} className="bar" />
        { isBar &&
          <div className="is-bar">{ 'value of "foo" is "bar"' }</div>
        }
        <div className="is-pristine">{ isPristine.toString() }</div>
        <button className="reset" onClick={() => reset()}>Reset</button>
        <button className="resetFn" onClick={() => reset((attrs) => ({ ...attrs, bar: 'bar' }))}>Reset with Fn</button>
      </div>
    );
  }

  it('uses initial value', () => {
    const wrapper = mount(<Form />);
    expect(wrapper.find("input.foo[value='foo']")).to.have.lengthOf(1);
  });

  it('handles input value change', () => {
    const wrapper = mount(<Form />);
    wrapper.find('input.foo').simulate('change', { target: { value: 'foo2' } });
    expect(wrapper.find("input.foo[value='foo2']")).to.have.lengthOf(1);
  });

  it('provides additional form helpers', () => {
    const wrapper = mount(<Form />);
    expect(wrapper.find('.is-bar')).to.have.lengthOf(0);
    wrapper.find('input.foo').simulate('change', { target: { value: 'bar' } });
    expect(wrapper.find('.is-bar')).to.have.lengthOf(1);
  });

  it('tracks pristine state', () => {
    const wrapper = mount(<Form />);
    expect(wrapper.find('.is-pristine').text()).to.eq('true');
    wrapper.find('input.foo').simulate('change', { target: { value: 'bar' } });
    expect(wrapper.find('.is-pristine').text()).to.eq('false');
    wrapper.find('.reset').simulate('click');
    expect(wrapper.find('.is-pristine').text()).to.eq('true');
    wrapper.find('.resetFn').simulate('click');
    expect(wrapper.find("input.foo[value='foo']")).to.have.lengthOf(1);
    expect(wrapper.find("input.bar[value='bar']")).to.have.lengthOf(1);
    expect(wrapper.find('.is-pristine').text()).to.eq('true');
  });

  describe('custom onChange handlers', () => {
    function Form() {
      const { $, set } = useForm({ initial: { foo: 'foo' } });

      return (
        <div>
          <Input {...$('foo', value => set('foo', value.toUpperCase()))} className="foo" />
        </div>
      );
    }

    it('allows to use custom onChange handler', () => {
      const wrapper = mount(<Form />);
      wrapper.find('input.foo').simulate('change', { target: { value: 'foo' } });
      expect(wrapper.find("input.foo[value='FOO']")).to.have.lengthOf(1);
    });

    describe('setting multiple values at once', () => {
      function Form() {
        const { $, set } = useForm({ initial: { foo: ', bar: ' } });

        const changeFoo = value => set({ foo: value, bar: value + 'bar' });

        return (
          <div>
            <Input {...$('foo', changeFoo)} className="foo" />
            <Input {...$('bar')} className="bar" />
          </div>
        );
      }

      it('allows to set multiple values at once via custom onChange handler', () => {
        const wrapper = mount(<Form />);
        wrapper.find('input.foo').simulate('change', { target: { value: 'foo' } });
        expect(wrapper.find("input.bar[value='foobar']")).to.have.lengthOf(1);
      });
    });

    describe('setting multiple values at once using updater function', () => {
      function Form() {
        const { $, set } = useForm({ initial: { foo: '', bar: '', baz: 'baz' } });

        const changeFoo = value => set(attrs => ({ foo: value, bar: attrs.baz + 'bar' }));

        return (
          <div>
            <Input {...$('foo', changeFoo)} className="foo" />
            <Input {...$('bar')} className="bar" />
          </div>
        );
      }

      it('allows to set multiple values at once via custom onChange handler', () => {
        const wrapper = mount(<Form />);
        wrapper.find('input.foo').simulate('change', { target: { value: 'foo' } });
        expect(wrapper.find("input.foo[value='foo']")).to.have.lengthOf(1);
        expect(wrapper.find("input.bar[value='bazbar']")).to.have.lengthOf(1);
      });
    });
  });

  describe('setState', () => {
    function Form() {
      const { $, setState, isPristine } = useForm({ initial: { foo: '', bar: '' } });

      useEffect(() => {
        setState((state) => {
          return {
            ...state,
            attrs: { foo: 'foo', bar: 'bar' },
            isPristine: true
          };
        });
      }, []);

      return (
        <div>
          <Input {...$('foo')} className="foo" />
          <Input {...$('bar')} className="bar" />
          <div className="is-pristine">{ isPristine.toString() }</div>
        </div>
      );
    }

    it('allows to update form internal state', () => {
      const wrapper = mount(<Form />);
      expect(wrapper.find("input.foo[value='foo']")).to.have.lengthOf(1);
      expect(wrapper.find("input.bar[value='bar']")).to.have.lengthOf(1);
      expect(wrapper.find('.is-pristine').text()).to.eq('true');
    });
  });

  describe('validations', () => {
    // eslint-disable-next-line react/prop-types
    function Form({ validationStrategy = 'onAnyError' }) {
      const { $, validate, setError } = useForm({
        initial: { foo: '' },
        validations: {
          rules: {
            foo: 'presence',
            bar: 'presence'
          },
          onChangeStrategy: validationStrategy
        }
      });

      return (
        <div>
          <Input {...$('foo')} wrapperClassName="foo" />
          <Input {...$('bar')} wrapperClassName="bar" />
          <button onClick={() => validate()} className="validate">Validate</button>
          <button onClick={() => setError('bar', 'invalid')} className="setBarError">Set error on bar</button>
        </div>
      );
    }

    it('provides `validate` helper', () => {
      const wrapper = mount(<Form />);
      expect(wrapper.find('.error')).to.have.lengthOf(0);
      wrapper.find('.validate').simulate('click');
      expect(wrapper.find('.error')).to.have.lengthOf(2);
    });

    describe('validation and custom onChange handler', () => {
      function Form() {
        const { $, set, validate } = useForm({
          initial: { foo: '' },
          validations: {
            foo: 'presence'
          }
        });

        return (
          <div>
            <Input {...$('foo', value => set('foo', value.toUpperCase()))} className="foo" />
            <button onClick={validate} className="validate">Validate</button>
          </div>
        );
      }

      it('validates on change with custom onChange handler', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.validate').simulate('click');
        expect(wrapper.find('.error')).to.have.lengthOf(1);
        wrapper.find('input.foo').simulate('change', { target: { value: 'foo' } });
        expect(wrapper.find('.error')).to.have.lengthOf(0);
        expect(wrapper.find("input.foo[value='FOO']")).to.have.lengthOf(1);
      });
    });

    describe('validating single input value stand-alone', () => {
      function Form() {
        const { $, validate } = useForm({
          initial: { foo: '', bar: { baz: '' } },
          validations: {
            'foo': 'presence',
            'bar.baz': 'presence'
          }
        });

        const validateFoo = () => validate('foo');
        const validateBaz = () => validate('bar.baz');

        return (
          <div>
            <Input {...$('foo')} onBlur={validateFoo} wrapperClassName="foo" />
            <Input {...$('bar.baz')} onBlur={validateBaz} wrapperClassName="baz" />
          </div>
        );
      }

      it('validates input on blur event', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.foo input').simulate('blur');
        expect(wrapper.find('.foo .error')).to.have.lengthOf(1);
        wrapper.find('.foo input').simulate('change', { target: { value: 'foo' } });
        expect(wrapper.find('.foo error')).to.have.lengthOf(0);
      });

      it('validates complex paths (nested attributes)', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.baz input').simulate('blur');
        expect(wrapper.find('.baz .error')).to.have.lengthOf(1);
        wrapper.find('.baz input').simulate('change', { target: { value: 'baz' } });
        expect(wrapper.find('.baz error')).to.have.lengthOf(0);
      });
    });

    describe('complex forms of value validation', () => {
      function Form() {
        const { $, validate } = useForm({
          initial: { foo: '' },
          validations: {
            foo: [
              'presence',
              { numericality: { lessThan: 10 } },
              function(value) {
                if (+value === 5) {
                  return 'Not five';
                }
              }]
          }
        });

        return (
          <div>
            <Input {...$('foo')} className="foo" />
            <button onClick={() => validate()} className="validate">Validate</button>
          </div>
        );
      }

      it('allows to use complex validation', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.validate').simulate('click');
        expect(wrapper.find('.error').text()).to.eq("Can't be empty");
        wrapper.find('input.foo').simulate('change', { target: { value: '11' } });
        expect(wrapper.find('.error').text()).to.eq('Should be less than 10');
        wrapper.find('input.foo').simulate('change', { target: { value: '5' } });
        expect(wrapper.find('.error').text()).to.eq('Not five');
        wrapper.find('input.foo').simulate('change', { target: { value: '3' } });
        expect(wrapper.find('.error')).to.have.lengthOf(0);
      });
    });

    describe('validating multiple values on setting them at once', () => {
      function Form() {
        const { $, set, validate } = useForm({
          initial: { foo: '', bar: '' },
          validations: {
            foo: 'presence',
            bar: 'presence'
          }
        });

        const changeFoo = value => set({ foo: value, bar: value + 'bar' });

        return (
          <div>
            <Input {...$('foo', changeFoo)} className="foo" errorClassName="foo-error" />
            <Input {...$('bar')} className="bar" errorClassName="bar-error" />

            <button onClick={() => validate()} className="validate">Validate</button>
          </div>
        );
      }

      it('runs all validations to validate all changes', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.validate').simulate('click');
        expect(wrapper.find('.foo-error')).to.have.lengthOf(1);
        expect(wrapper.find('.bar-error')).to.have.lengthOf(1);
        wrapper.find('input.foo').simulate('change', { target: { value: 'foo' } });
        expect(wrapper.find('.foo-error')).to.have.lengthOf(0);
        expect(wrapper.find('.bar-error')).to.have.lengthOf(0);
      });
    });

    describe('complex validation with wildcards and dependencies', () => {
      function Form() {
        const { get, set, $, getError, validate } = useForm({
          initial: { foos: [] },
          validations: {
            'foos': 'presence',
            'foos.*.value': {
              rules: ['presence', (value, { name, attrs }) => {
                const index = +name.split('.')[1];
                const max = attrs.foos[index].max;

                if (+value > max) {
                  return `Too much (max ${max})`;
                }
              }],
              deps: ['foos.*.max']
            },
            'foos.2.nested.*.value': function(value) {
              if (value === false) {
                return 'Should be set';
              }
            },
            'foos.*.nested.*.value': function(value, { name }) {
              if (name === 'foos.2.nested.1.value') {
                return 'Should not be set';
              }
            }
          }
        });

        const setState = () => {
          set('foos', [{}, { value: 3, max: 2 }, { nested: [{ value: false }, { value: true }] }]);
        };

        return (
          <div>
            { get('foos').map((_item, i) => (
                <div key={i}>
                  <Input {...$(`foos.${i}.value`)} wrapperClassName={`foo-value-${i}`} />
                  <Input {...$(`foos.${i}.max`)} wrapperClassName={`foo-max-${i}`} />

                  { get(`foos.${i}.nested`) && get(`foos.${i}.nested`).map((obj, n) => (
                      <div key={n} className={`foos-${i}-nested-${n}`}>
                        <input
                          type="checkbox"
                          checked={obj.value}
                          onChange={(e) => set(`foos.${i}.nested.${n}.value`, e.target.checked)}
                        />
                        { getError(`foos.${i}.nested.${n}.value`) &&
                          <div className="error">
                            { getError(`foos.${i}.nested.${n}.value`) }
                          </div>
                        }
                      </div>
                    ))
                  }
                </div>
              ))
            }
            { getError('foos') &&
              <div className="foos-error">{ getError('foos') }</div>
            }
            <button onClick={setState} className="setState">Set State</button>
            <button onClick={validate} className="validate">Validate</button>
          </div>
        );
      }

      it('allows to use wildcard validation with input dependencies', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.validate').simulate('click');
        expect(wrapper.find('.foos-error')).to.have.lengthOf(1);
        wrapper.find('.setState').simulate('click');
        expect(wrapper.find('.foos-error')).to.have.lengthOf(0);
        expect(wrapper.find('.foo-value-0 .error')).to.have.lengthOf(1);
        expect(wrapper.find('.foo-value-1 .error')).to.have.lengthOf(1);
        wrapper.find('.foo-value-1 input').simulate('change', { target: { value: '2' } });
        expect(wrapper.find('.foo-value-1 .error')).to.have.lengthOf(0);
        wrapper.find('.foo-max-1 input').simulate('change', { target: { value: '1' } });
        expect(wrapper.find('.foo-value-1 .error')).to.have.lengthOf(1);
      });

      it('allows to use semi-wildcard and all-wildcard validation rules', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.setState').simulate('click');
        wrapper.find('.validate').simulate('click');
        expect(wrapper.find('.foos-2-nested-0 .error')).to.have.lengthOf(1);
        expect(wrapper.find('.foos-2-nested-1 .error')).to.have.lengthOf(1);
      });
    });

    describe('validation captures and pinned dependencies', () => {
      function Form() {
        const validationCounter = useRef(0);
        const { get, set, $, getError, validate } = useForm({
          initial: { foos: [] },
          validations: {
            onChangeStrategy: 'onAfterValidate',
            rules: {
              'foos': 'presence',
              'foos.(index).value': {
                rules: ['presence', (value, { index, attrs }) => {
                  validationCounter.current++;
                  const max = attrs.foos[index].max;

                  if (+value > max) {
                    return `Too much (max ${max})`;
                  }
                }],
                deps: ['foos.^.max']
              }
            }
          }
        });

        const setState = () => {
          set('foos', [{ value: 2, max: 2 }, { value: 3, max: 2 }]);
        };

        return (
          <div>
            { get('foos').map((_item, i) => (
                <div key={i}>
                  <Input {...$(`foos.${i}.value`)} wrapperClassName={`foo-value-${i}`} />
                  <Input {...$(`foos.${i}.max`)} wrapperClassName={`foo-max-${i}`} />
                </div>
              ))
            }
            { getError('foos') &&
              <div className="foos-error">{ getError('foos') }</div>
            }
            <div className="validationCounter">{ validationCounter.current }</div>
            <button onClick={setState} className="setState">Set State</button>
            <button onClick={validate} className="validate">Validate</button>
          </div>
        );
      }

      it('allows to use validation captures and pinned dependencies', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.setState').simulate('click');
        wrapper.find('.validate').simulate('click');
        expect(wrapper.find('.foo-value-0 .error')).to.have.lengthOf(0);
        expect(wrapper.find('.foo-value-1 .error')).to.have.lengthOf(1);
        expect(wrapper.find('.validationCounter').text()).to.eq('2');
        wrapper.find('.foo-value-1 input').simulate('change', { target: { value: '2' } });
        expect(wrapper.find('.foo-value-1 .error')).to.have.lengthOf(0);
        expect(wrapper.find('.validationCounter').text()).to.eq('3');
        wrapper.find('.foo-max-1 input').simulate('change', { target: { value: '1' } });
        expect(wrapper.find('.foo-value-1 .error')).to.have.lengthOf(1);
        expect(wrapper.find('.validationCounter').text()).to.eq('4');
      });
    });

    describe('strict validation rules', () => {
      function Form() {
        const { get, $, getError, validate } = useForm({
          initial: { foos: [{ value: 1 }] },
          validations: {
            onChangeStrategy: 'onAfterValidate',
            rules: {
              'foos.*.value': 'presence',
              'foos.1.value': (value) => {
                if (value) return 'Always invalid';
              }
            }
          }
        });

        return (
          <div>
            { get('foos').map((_item, i) => (
                <div key={i}>
                  <Input {...$(`foos.${i}.value`)} wrapperClassName={`foo-value-${i}`} />
                  <Input {...$(`foos.${i}.max`)} wrapperClassName={`foo-max-${i}`} />
                </div>
              ))
            }

            { getError('foos.1.value') &&
              <div className="foo-1-error">{ getError('foos.1.value') }</div>
            }

            <button onClick={validate} className="validate">Validate</button>
          </div>
        );
      }

      it('does not validate unexisting items via wildcards if other rule with explicit index exists', () => {
        const wrapper = mount(<Form />);
        wrapper.find('.validate').simulate('click');
        expect(wrapper.find('.foo-value-0 .error')).to.have.lengthOf(0);
        expect(wrapper.find('.foo-1-error')).to.have.lengthOf(0);
      });
    });

    describe('callbacks usage', () => {
      // eslint-disable-next-line react/prop-types
      function Form({ onValid, onError }) {
        const { $, validate } = useForm({
          initial: { foo: '' },
          validations: {
            foo: 'presence'
          }
        });

        const save = () => {
          validate()
            .then(onValid)
            .catch(onError);
        };

        return (
          <div>
            <Input {...$('foo')} className="foo" />
            <button onClick={save} className="save">Save</button>
          </div>
        );
      }

      it('allows to use callbacks', async () => {
        const validSpy = sinon.spy();
        const errorSpy = sinon.spy();
        const wrapper = mount(<Form onValid={validSpy} onError={errorSpy} />);

        await nextFrame(() => wrapper.find('.save').simulate('click'));

        expect(validSpy).to.have.property('callCount', 0);
        expect(errorSpy).to.have.property('callCount', 1);

        await nextFrame(() => {
          wrapper.find('input.foo').simulate('change', { target: { value: '1' } });
          wrapper.find('.save').simulate('click');
        });

        expect(validSpy).to.have.property('callCount', 1);

        // callbacks are executed within `requestAnimationFrame` wrapper to have
        // new form content rendered.
        function nextFrame(fn) {
          return new Promise((resolve) => {
            fn();
            setTimeout(resolve, 10);
          });
        }
      });
    });

    describe('onChange validation strategy', () => {
      describe('onAnyError (default)', () => {
        it('does not initially validate input on change', () => {
          const wrapper = mount(<Form />);
          wrapper.find('.foo input').simulate('change', { target: { value: '' } });
          expect(wrapper.find('.foo .error')).to.have.lengthOf(0);
        });

        it('validates input on change if there are any errors on the form', () => {
          const wrapper = mount(<Form />);
          wrapper.find('.validate').simulate('click');
          expect(wrapper.find('.foo .error')).to.have.lengthOf(1);
          wrapper.find('.foo input').simulate('change', { target: { value: '1' } });
          expect(wrapper.find('.foo .error')).to.have.lengthOf(0);
          wrapper.find('.foo input').simulate('change', { target: { value: '' } });
          expect(wrapper.find('.foo .error')).to.have.lengthOf(1);

          wrapper.find('.foo input').simulate('change', { target: { value: '1' } });
          wrapper.find('.bar input').simulate('change', { target: { value: '1' } });
          wrapper.find('.foo input').simulate('change', { target: { value: '' } });
          expect(wrapper.find('.foo .error')).to.have.lengthOf(0);
        });
      });

      describe('onAfterValidate', () => {
        it('does not initially validate input on change', () => {
          const wrapper = mount(<Form />);
          wrapper.find('.foo input').simulate('change', { target: { value: '' } });
          expect(wrapper.find('.foo .error')).to.have.lengthOf(0);
        });

        it('validates input on change after validation helper call', () => {
          const wrapper = mount(<Form validationStrategy="onAfterValidate" />);
          wrapper.find('.setBarError').simulate('click');
          wrapper.find('.foo input').simulate('change', { target: { value: '' } });
          expect(wrapper.find('.foo .error')).to.have.lengthOf(0);
          wrapper.find('.bar input').simulate('change', { target: { value: '1' } });
          expect(wrapper.find('.bar .error')).to.have.lengthOf(0);
          wrapper.find('.bar input').simulate('change', { target: { value: '' } });
          expect(wrapper.find('.bar .error')).to.have.lengthOf(0);

          wrapper.find('.validate').simulate('click');
          expect(wrapper.find('.foo .error')).to.have.lengthOf(1);
          expect(wrapper.find('.bar .error')).to.have.lengthOf(1);

          wrapper.find('.foo input').simulate('change', { target: { value: '1' } });
          wrapper.find('.bar input').simulate('change', { target: { value: '1' } });
          expect(wrapper.find('.foo .error')).to.have.lengthOf(0);
          expect(wrapper.find('.bar .error')).to.have.lengthOf(0);

          wrapper.find('.foo input').simulate('change', { target: { value: '' } });
          expect(wrapper.find('.foo .error')).to.have.lengthOf(1);
        });
      });
    });
  });

  describe('setErrors', () => {
    // eslint-disable-next-line react/prop-types
    function Form({ onErrors }) {
      const { $, setError } = useForm();

      const setErrors = () => {
        setError('foo', 'invalid').then(onErrors);
      };

      return (
        <div>
          <Input {...$('foo')} wrapperClassName="foo" />
          <button onClick={setErrors} className="setErrors">Validate</button>
        </div>
      );
    }

    it('returns a promise that is resolved after errors are rendered', async () => {
      let renderedError = null;
      const wrapper = mount(<Form onErrors={() => renderedError = wrapper.find('.foo .error')} />);
      await wrapper.find('.setErrors').simulate('click');
      expect(renderedError).to.have.lengthOf(1);
    });
  });

  describe('form partials', () => {
    function OrderForm() {
      const { $, get, validate, usePartial } = useForm({
        initial: { username: '', items: [{}, {}] },
        validations: {
          username: 'presence'
        }
      });

      return (
        <div>
          <Input {...$('username')} className="username" />
          { get('items').map((item, i) => (
              <ItemForm key={i} usePartial={usePartial} index={i} />
            ))
          }
          <button onClick={validate} className="validate">Validate</button>
        </div>
      );
    }

    // eslint-disable-next-line react/prop-types
    function ItemForm({ usePartial, index }) {
      const { $, getError, set } = usePartial({
        prefix: `items.${index}`,
        validations: {
          name: 'presence',
          amount: {
            rules: [
              'presence',
              function(value, { attrs }) {
                if (+value > 1 && attrs.items[index].name === 'expensive') {
                  return 'Too many';
                }
              }
            ],
            partialDeps: ['name']
          }
        }
      });

      const changeAmount = (amount) => {
        set((attrs) => {
          if (attrs.name === 'foo') {
            return { amount: (+amount * 2).toString() };
          } else if (amount === '100') {
            return { name: '', amount };
          } else {
            return { amount };
          }
        });
      };

      return (
        <>
          <Input {...$('name')} className={`items-${index}-name`} />
          <Input {...$('amount', changeAmount)} className={`items-${index}-amount`} />
          <div className={`items-${index}-name-error`}>{ getError('name') }</div>
        </>
      );
    }

    it('validates inputs rendered via `usePartial` helper', () => {
      const wrapper = mount(<OrderForm />);

      expect(wrapper.find('.error')).to.have.lengthOf(0);
      wrapper.find('.validate').simulate('click');
      expect(wrapper.find('.username .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-0-name .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-1-name .error')).to.have.lengthOf(1);

      expect(wrapper.find('.items-1-name-error').text()).to.eq("Can't be empty");
    });

    it('allows to use setter function in partial set', () => {
      const wrapper = mount(<OrderForm />);

      wrapper.find('.validate').simulate('click');
      wrapper.find('input.items-0-name').simulate('change', { target: { value: 'foo' } });
      wrapper.find('input.items-0-amount').simulate('change', { target: { value: '2' } });
      expect(wrapper.find("input.items-0-amount[value='4']")).to.have.lengthOf(1);
      wrapper.find('input.items-0-name').simulate('change', { target: { value: 'bar' } });
      wrapper.find('input.items-0-amount').simulate('change', { target: { value: '100' } });
      expect(wrapper.find('.items-0-name .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-0-name-error').text()).to.eq("Can't be empty");
    });

    it('allows to specify partial validation deps', () => {
      const wrapper = mount(<OrderForm />);

      wrapper.find('.validate').simulate('click');
      wrapper.find('input.items-0-amount').simulate('change', { target: { value: '2' } });
      expect(wrapper.find('.items-0-amount .error')).to.have.lengthOf(0);
      wrapper.find('input.items-0-name').simulate('change', { target: { value: 'expensive' } });
      expect(wrapper.find('.items-0-amount .error')).to.have.lengthOf(1);
    });
  });

  describe('makeForm', () => {
    const [FormProvider, useOrderForm] = makeForm({
      initial: {
        username: '',
        address: '',
        guest: false,
        items: [{}, {}]
      },
      validations: {
        'username': 'presence',
        'items.*.name': 'presence'
      }
    });

    function OrderForm() {
      const { $, validate, useConfig, helperText, attrs: { guest, items } } = useOrderForm();

      useConfig(() => {
        if (!guest) {
          return {
            validations: { address: 'presence' }
          };
        }
      }, [guest]);

      return (
        <div>
          <Input {...$('username')} className="username" />
          <Input {...$('address')} className="address" />
          <Checkbox {...$('guest')} className="guest" />
          { items.map((item, i) => (
              <ItemForm key={i} index={i} />
            ))
          }
          <button onClick={validate} className="validate">Validate</button>
          { helperText &&
            <div className="helper-text">{ helperText }</div>
          }
        </div>
      );
    }

    // eslint-disable-next-line react/prop-types
    function ItemForm({ index }) {
      const { $ } = useOrderForm();

      return <Input {...$(`items.${index}.name`)} className={`items-${index}`} />;
    }

    it('validates inputs rendered via built helper hook, merging props config into a form configs, correctly handling dynamic config', () => {
      function Page() {
        const [counter, setCounter] = useState(1);

        const config = useMemo(() => ({
          validations: {
            'items.*.name': {
              numericality: {
                lessThan: 10
              }
            }
          },
          helpers: () => ({
            helperText: `counter-${counter}`
          })
        }), [counter]);

        return (
          <div>
            <FormProvider config={config}>
              <OrderForm />
            </FormProvider>
            <button className="helper-increment" onClick={() => setCounter(counter + 1)}>Increment</button>
          </div>
        );
      }

      const wrapper = mount(<Page />);

      expect(wrapper.find('.helper-text').text()).to.eq('counter-1');
      wrapper.find('.helper-increment').simulate('click');
      expect(wrapper.find('.helper-text').text()).to.eq('counter-2');

      expect(wrapper.find('.error')).to.have.lengthOf(0);
      wrapper.find('.validate').simulate('click');
      expect(wrapper.find('.username .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-0 .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-1 .error')).to.have.lengthOf(1);
      wrapper.find('input.items-0').simulate('change', { target: { value: '20' } });
      expect(wrapper.find('.items-0 .error')).to.have.lengthOf(1);
    });

    it('validates inputs declared with useConfig hook, and revalidates them on dependencies change', () => {
      const wrapper = mount(
        <FormProvider>
          <OrderForm />
        </FormProvider>
      );

      expect(wrapper.find('.error')).to.have.lengthOf(0);
      wrapper.find('.validate').simulate('click');
      expect(wrapper.find('.address .error')).to.have.lengthOf(1);
      wrapper.find('input.guest').simulate('change', { target: { checked: true } });
      expect(wrapper.find('.address .error')).to.have.lengthOf(0);
      wrapper.find('input.guest').simulate('change', { target: { checked: false } });
      expect(wrapper.find('.address .error')).to.have.lengthOf(1);
    });
  });

  describe('controlled form', () => {
    const [FormProvider, useOrderForm] = makeForm({
      validations: {
        'username': 'presence',
        'address': 'presence',
        'items.*.name': 'presence'
      }
    });

    function OrderForm() {
      const { $, validate, useConfig, attrs: { guest, items } } = useOrderForm();

      useConfig(() => {
        if (!guest) {
          return {
            validations: { address: 'presence' }
          };
        }
      }, [guest]);

      return (
        <div>
          <Input {...$('username')} className="username" />
          <Input {...$('address')} className="address" />
          <Checkbox {...$('guest')} className="guest" />
          { items.map((item, i) => (
              <ItemForm key={i} index={i} />
            ))
          }
          <button onClick={validate} className="validate">Validate</button>
        </div>
      );
    }

    // eslint-disable-next-line react/prop-types
    function ItemForm({ index }) {
      const { $ } = useOrderForm();

      return <Input {...$(`items.${index}.name`)} className={`items-${index}`} />;
    }

    it('has initial values from attrs, emits onChange and accepts attrs from elsewhere', () => {
      function Page() {
        const [attrs, setAttrs] = useState({
          username: 'foo',
          address: '',
          guest: false,
          items: [{}, {}]
        });

        const fillForm = () => {
          setAttrs({
            username: 'Guest',
            address: '',
            guest: true,
            items: [{ name: 100 }]
          });
        };

        const config = useMemo(() => ({
          validations: {
            'items.*.name': {
              numericality: {
                lessThan: 10
              }
            }
          }
        }), []);

        return (
          <div>
            <FormProvider config={config} attrs={attrs} onChange={setAttrs}>
              <OrderForm />
            </FormProvider>
            <button className="helper-fill" onClick={fillForm}>Fill form</button>
          </div>
        );
      }

      const wrapper = mount(<Page />);

      expect(wrapper.find("input.username[value='foo']")).to.have.lengthOf(1);
      wrapper.find('.validate').simulate('click');
      wrapper.find('.helper-fill').simulate('click');

      expect(wrapper.find('.address .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-0 .error')).to.have.lengthOf(1);
    });

    it('allows to skip validation via onSet property', () => {
      function Page() {
        const [attrs, setAttrs] = useState({
          username: 'foo',
          address: '',
          guest: false,
          items: [{}]
        });

        const addItem = () => {
          setAttrs({ ...attrs, items: [...attrs.items, {}] });
        };

        const config = useMemo(() => ({
          validations: {
            'items.*.name': 'presence'
          }
        }), []);

        const onSet = (setAttrs) => {
          setAttrs({ validate: false });
        };

        return (
          <div>
            <FormProvider config={config} attrs={attrs} onChange={setAttrs} onSet={onSet}>
              <OrderForm />
            </FormProvider>
            <button className="helper-add-item" onClick={addItem}>Add item</button>
          </div>
        );
      }

      const wrapper = mount(<Page />);

      wrapper.find('.validate').simulate('click');
      wrapper.find('.helper-add-item').simulate('click');

      expect(wrapper.find('.address .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-0 .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-1 .error')).to.have.lengthOf(0);
    });
  });
});
