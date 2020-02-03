import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AppThunk } from '../../store';

export interface SampleState {
    accumulator : number;
}

const initialState: SampleState = {
    accumulator: 123
}

const sampleAccumulator = createSlice({
  name: 'sampleAccumulator',
  initialState,
  reducers: {
    add(state, action: PayloadAction<number>) {
        state.accumulator += action.payload;
    },
    sub(state, action: PayloadAction<number>) {
      state.accumulator -= action.payload
    },
  }
})

export const { add, sub } = sampleAccumulator.actions

export default sampleAccumulator.reducer


/* EXAMPLE: (see Redux Toolkit advanced examples & rtk-github-issues-example code)
export const fetchIssuesCount = (
  org: string,
  repo: string
): AppThunk => async dispatch => {
  try {
    const repoDetails = await getRepoDetails(org, repo)
    dispatch(getRepoDetailsSuccess(repoDetails))
  } catch (err) {
    dispatch(getRepoDetailsFailed(err.toString()))
  }
}
*/

export const asyncAdd = (
  amt: number
): AppThunk => async dispatch => {
  setTimeout(()=>{
    dispatch(add(amt))
  },2000);
}
