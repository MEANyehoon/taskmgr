import {NgModule} from '@angular/core';
/**
 * combineReducers 接收一系列的 reducer 作为参数，然后创建一个新的 reducer
 * 这个新的 reducer 接收到各 reducer 的值后，按 reducer 的 key 进行存储。
 * 把这个新的 reducer 想象成一个数据库，各个子 reducer 就像数据库中的表。
 *
 * compose 函数是一个很方便的工具，简单来说，它接受任意数量的函数作为参数，然后返回一个新的函数。
 * 这个新的函数其实就是前面的函数的叠加，比如说，我们给出 `compose(f(x), g(x))`, 返回的新函数
 * 就是 `g(f(x))`。
 */
import {
  ActionReducerMap,
  ActionReducer,
  MetaReducer,
  StoreModule,
  compose,
  createSelector,
} from '@ngrx/store';
import * as fromRouter from '@ngrx/router-store';
import {StoreRouterConnectingModule} from '@ngrx/router-store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '../../environments/environment';
import {Auth} from '../domain';
import * as authActions from '../actions/auth.action';

/**
 * storeFreeze 用于防止 state 被修改，在 Redux 中我们必须确保 state 是不可更改的，这个函数
 * 有助于帮我们检测 state 是否被有意或无意的修改了。当 state 发生修改时，会抛出一个异常，这一点
 * 在开发时非常有帮助。根据环境变量的值，发布时会不包含这个函数。
 */
import {storeFreeze} from 'ngrx-store-freeze';
/**
 * 分别从每个 reducer 中将需要导出的函数或对象进行导出，并起个易懂的名字
 */
import * as fromAuth from './auth.reducer';
import * as fromQuote from './quote.reducer';
import * as fromProjects from './project.reducer';
import * as fromTaskLists from './task-list.reducer';
import * as fromTasks from './task.reducer';
import * as fromUsers from './user.reducer';
import { initialState } from './user.reducer';

/**
 * 正如我们的 reducer 像数据库中的表一样，我们的顶层 state 也包含各个子 reducer 的 state
 * 并且使用一个 key 来标识各个子 state
 */
export interface State {
  auth: Auth;
  quote: fromQuote.State;
  projects: fromProjects.State;
  taskLists: fromTaskLists.State;
  tasks: fromTasks.State;
  users: fromUsers.State;
  router: fromRouter.RouterReducerState;
}

const reducers: ActionReducerMap<State> = {
  auth: fromAuth.reducer,
  quote: fromQuote.reducer,
  projects: fromProjects.reducer,
  taskLists: fromTaskLists.reducer,
  tasks: fromTasks.reducer,
  users: fromUsers.reducer,
  router: fromRouter.routerReducer,
};

const initState = {
  auth: fromAuth.initialState,
  quote: fromQuote.initialState,
  projects: fromProjects.initialState,
  taskLists: fromTaskLists.initialState,
  tasks: fromTasks.initialState,
  users: fromUsers.initialState,
};

export function logger(reducer: ActionReducer<State>): ActionReducer<State> {
  return function(state: State, action: any): State {
    console.log('state', state);
    console.log('action', action);

    return reducer(state, action);
  };
}

export function storeStateGuard(reducer) {
  return function (state, action) {
      if (action.type === authActions.LOGOUT) {
          return reducer(undefined, action);
      }

      return reducer(state, action);
  }
}

export const metaReducers: MetaReducer<State>[] = !environment.production
  ? [logger, storeStateGuard]
  : [storeStateGuard];

export const getAuthState = (state: State) => state.auth;
export const getQuoteState = (state: State) => state.quote;
export const getProjectsState = (state: State) => state.projects;
export const getTaskListsState = (state: State) => state.taskLists;
export const getTasksState = (state: State) => state.tasks;
export const getUserState = (state: State) => state.users;

export const getQuote = createSelector(getQuoteState, fromQuote.getQuote);
export const getProjects = createSelector(getProjectsState, fromProjects.getAll);
export const getTasks = createSelector(getTasksState, fromTasks.getTasks);

const getSelectedProjectId = createSelector(getProjectsState, fromProjects.getSelectedId);
const getTaskLists = createSelector(getTaskListsState, fromTaskLists.getTaskLists);
const getTaskListEntities = createSelector(getTaskListsState, fromTaskLists.getEntities);
const getTaskListSelectedIds = createSelector(getTaskListsState, fromTaskLists.getSelectedIds);

const getUserEntities = createSelector(getUserState, fromUsers.getEntities);
const getTasksWithOwner = createSelector(getTasks, getUserEntities, (tasks, entities) => tasks.map(task =>
  (
    {...task,
      owner: entities[task.ownerId],
      participants: task.participantIds.map(id => entities[id])
    }
  )));

export const getProjectTaskList = createSelector(getSelectedProjectId, getTaskLists, (projectId, taskLists) => {
  return taskLists.filter(taskList => taskList.projectId === projectId);
});
export const getTasksByList = createSelector(getProjectTaskList, getTasksWithOwner, (lists, tasks) => {
  return lists.map(list => ({...list, tasks: tasks.filter(task => task.taskListId === list.id)}));
});
export const getProjectMembers = (projectId: string) => createSelector(getProjectsState, getUserEntities, (state, entities) => {
  return state.entities[projectId].members.map(id => entities[id]);
});
export const getAuth = createSelector(getAuthState, getUserEntities, (_auth, _entities) => {
  return {..._auth, user: _entities[_auth.userId]};
});
export const getAuthUser = createSelector(getAuthState, getUserEntities, (_auth, _entities) => {
  return _entities[_auth.userId];
});
export const getMaxListOrder = createSelector(getTaskListEntities, getTaskListSelectedIds, (entities, ids) => {
  const orders: number[] = ids.map(id => entities[id].order);
  return orders.sort()[orders.length - 1];
});
export const getUserTasks = createSelector(getAuthUser, getTasks, (user, tasks) => {
  return tasks.filter(task => task.ownerId === user.id)
});

@NgModule({
  imports: [
    /**
     * StoreModule.provideStore  仅需引入一次，请把它包含在根模块或者 CoreModule 中
     * 我们这里为了方便组织，新建了一个 AppStoreModule，但也是只在 CoreModule 中引入的
     */
    StoreModule.forRoot(reducers, {initialState: initState, metaReducers: metaReducers }),
    StoreRouterConnectingModule,
    // DevTool 需要在 StoreModule 之后导入
    // !environment.production ? StoreDevtoolsModule.instrument({ maxAge: 50 }) : []
  ]
})
export class AppStoreModule {
}
