import {Quote} from '../domain';
import * as actions from '../actions/quote.action';

export interface State {
  quote: Quote;
}

export const initialState: State = {
  quote: {
    cn: '满足感在于不断的努力，而不是现有成就。全心努力定会胜利满满。',
    en: 'Satisfaction lies in the effort, not in the attainment. Full effort is full victory. ',
    pic: 'assets/img/quote_fallback.jpg',
  }
};

export function reducer(state: State = initialState, action: actions.Actions): State {
  switch (action.type) {
    case actions.QUOTE_SUCCESS:
      return {...state, quote: action.payload};
    case actions.QUOTE_FAIL:
    default:
      return state;
  }
}

export const getQuote = (state: State) => state.quote;
