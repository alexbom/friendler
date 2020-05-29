import * as RX from 'reactxp';

import {AdaptiveProps, ConditionProps} from '../config/types';
import {sScreen} from './';

const cloneDeep = require('lodash/cloneDeep');
const assign = require('lodash/assign');

export const adaptive = (
  style: RX.Types.StyleRuleSetRecursive<any>,
  props: AdaptiveProps
): RX.Types.StyleRuleSetRecursive<any> => Object.keys(props).reduce(
  (acc, key) => (
    sScreen.type()[key]() ? concat(acc, props[key]) : acc
  ), style
);

export const conditions = (
  style: RX.Types.StyleRuleSet<any>,
  props: ConditionProps[]
): RX.Types.StyleRuleSetRecursive<any> => props.reduce(
  (acc, prop) => (
    prop.if ? concat(acc, prop.then) : acc
  ), style
);

export const concat = (
  style1: RX.Types.StyleRuleSetRecursive<any>,
  style2?: RX.Types.StyleRuleSetRecursive<any>
): RX.Types.StyleRuleSetRecursive<any> => {
  let newStyle;

  if (style1) {
    if ((style1 as any).length) {
      newStyle = assign(...style1);
    } else {
      newStyle = cloneDeep(style1);
    }
  }

  if (style2) {
    if ((style2 as any).length) {
      newStyle = assign(newStyle, ...style2);
    } else {
      newStyle = {...newStyle, ...style2};
    }
  }

  return newStyle;
};
