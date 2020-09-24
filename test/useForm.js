import React, { useState, useMemo } from 'react';
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

  describe('validations', () => {
    function Form() {
      const { $, validate } = useForm({
        initial: { foo: '' },
        validations: {
          foo: 'presence',
          bar: 'presence'
        }
      });

      return (
        <div>
          <Input {...$('foo')} wrapperClassName="foo" />
          <Input {...$('bar')} wrapperClassName="bar" />
          <button onClick={() => validate()} className="validate">Validate</button>
        </div>
      );
    }

    it('provides `validate` helper', () => {
      const wrapper = mount(<Form />);
      expect(wrapper.find('.error')).to.have.lengthOf(0);
      wrapper.find('.validate').simulate('click');
      expect(wrapper.find('.error')).to.have.lengthOf(2);
    });

    it('does not initially validate input on change', () => {
      const wrapper = mount(<Form />);
      wrapper.find('.foo input').simulate('change', { target: { value: '' } });
      expect(wrapper.find('.foo .error')).to.have.lengthOf(0);
    });

    it('validates input on change if there are any errors on the form', () => {
      const wrapper = mount(<Form />);
      wrapper.find('.foo input').simulate('change', { target: { value: '' } });
      wrapper.find('.validate').simulate('click');
      expect(wrapper.find('.foo .error')).to.have.lengthOf(1);
      wrapper.find('.foo input').simulate('change', { target: { value: '1' } });
      expect(wrapper.find('.foo .error')).to.have.lengthOf(0);
      wrapper.find('.foo input').simulate('change', { target: { value: '' } });
      expect(wrapper.find('.foo .error')).to.have.lengthOf(1);
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
            }
          }
        });

        const setState = () => {
          set('foos', [{}, { value: 3, max: 2 }]);
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
      const { $ } = usePartial({
        prefix: `items.${index}`,
        validations: {
          name: 'presence'
        }
      });

      return <Input {...$('name')} className={`items-${index}`} />;
    }

    it('validates inputs rendered via `usePartial` helper', () => {
      const wrapper = mount(<OrderForm />);

      expect(wrapper.find('.error')).to.have.lengthOf(0);
      wrapper.find('.validate').simulate('click');
      expect(wrapper.find('.username .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-0 .error')).to.have.lengthOf(1);
      expect(wrapper.find('.items-1 .error')).to.have.lengthOf(1);
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
  });
});
