import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Input } from '../inputs';

ItemForm.propTypes = {
  index: PropTypes.number,
  usePartial: PropTypes.func,
  onRemove: PropTypes.func
};

export default function ItemForm({ index, usePartial, onRemove }) {
  const { $, get, set, getError } = usePartial({
    prefix: `items.${index}`,
    validations: {
      id: 'presence',
      count: {
        rules: [
          'presence',
          function(value, { attrs }) {
            if (attrs.username != 'richguy' && +value > 10) {
              return "You can't afford this much!";
            }
          },
          function(value, { attrs }) {
            if (attrs.items[index].id > 10 && value != 1) {
              return 'Only one such item is available';
            }
          }
        ],
        deps: ['username'],
        partialDeps: ['id']
      },
      'wildcards.*.value': 'presence'
    }
  });

  const changeId = useCallback((id) => {
    set((attrs) => {
      if (+attrs.count > 1000) {
        return attrs;
      } else if (+attrs.count > 100) {
        return { id };
      } else {
        return { id, count: '' };
      }
    });
  }, []);

  const addWildcard = () => {
    const wildcards = get('wildcards') || [];

    set('wildcards', [...wildcards, { value: false }]);
  };

  return (
    <div>
      <div>
        <Input {...$('id', changeId)} placeholder="Item ID" />
      </div>
      <div>
        <Input {...$('count')} placeholder="Item Count" />
      </div>

      <div>
        { get('wildcards') && get('wildcards').map((wildcard, i) => (
            <div key={i}>
              <input
                type="checkbox"
                checked={get(`wildcards.${i}.value`)}
                onChange={(e) => set(`wildcards.${i}.value`, e.target.checked)}
              />
              { getError(`wildcards.${i}.value`) &&
                <div className="error">{ getError(`wildcards.${i}.value`) }</div>
              }
            </div>
          ))
        }
      </div>

      <button onClick={addWildcard}>Add wildcard</button>
      <button onClick={onRemove}>Remove this Item</button>
    </div>
  );
}
