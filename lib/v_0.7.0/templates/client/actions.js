/**
 * All __name__ CRUD actions
 *
 * Actions are payloads of information that send data from the application
 * (i.e. Yote server) to the store. They are the _only_ source of information
 * for the store.
 *
 * NOTE: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import api utility
import callAPI from '../../global/utils/api'

const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.__name__;
  if(selected.id !== id) {
    // the "selected" id changed, so we _should_ fetch
    // console.log("Y shouldFetch - true: id changed");
    return true;
  } else if(!byId[id]) {
    // the id is not in the map, fetch from server
    // console.log("Y shouldFetch - true: not in map");
    return true;
  } else if(selected.isFetching) {
    // "selected" is already fetching, don't do anything
    // console.log("Y shouldFetch - false: isFetching");
    return false;
  } else if(new Date().getTime() - selected.lastUpdated > (1000 * 60 * 5)) {
    // if it's been longer than 5 minutes since the last fetch, get a new one
    // console.log("Y shouldFetch - true: older than 5 minutes");
    return true;
  } else {
    // else if "selected" is invalidated, fetch a new one, otherwise don't
    // console.log("Y shouldFetch - " + selected.didInvalidate + ": didInvalidate");
    return selected.didInvalidate;
  }
}

export const INVALIDATE_SELECTED___actionCase__ = "INVALIDATE_SELECTED___actionCase__"
export function invaldiateSelected() {
  return {
    type: INVALIDATE_SELECTED___actionCase__
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingle__Proper__ById(id))
  } else {
    return dispatch(returnSingle__Proper__Promise(id)); // return promise that contains __name__
  }
}

export const returnSingle__Proper__Promise = (id) => (dispatch, getState) => {
  /**
   * This returns the object from the map so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. This is because if we have any `.then()'s`
   * in the components, they will fail when we don't need to fetch.
   */
  return new Promise((resolve, reject) => {
    resolve({
      type: "RETURN_SINGLE___actionCase___WITHOUT_FETCHING"
      , id: id
      , item: getState().__name__.byId[id]
      , success: true
    })
  });
}

export const REQUEST_SINGLE___actionCase__ = "REQUEST_SINGLE___actionCase__";
function requestSingle__Proper__(id) {
  return {
    type: REQUEST_SINGLE___actionCase__
    , id
  }
}

export const RECEIVE_SINGLE___actionCase__ = "RECEIVE_SINGLE___actionCase__";
function receiveSingle__Proper__(json) {
  return {
    type: RECEIVE_SINGLE___actionCase__
    , id: json.__name__._id || null // to avoid silent error if empty json
    , item: json.__name__
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function fetchSingle__Proper__ById(__name__Id) {
  return dispatch => {
    dispatch(requestSingle__Proper__(__name__Id))
    return callAPI(`/api/__kebabName__s/${__name__Id}`)
      .then(json => dispatch(receiveSingle__Proper__(json)))
  }
}

export const ADD_SINGLE___actionCase___TO_MAP = "ADD_SINGLE___actionCase___TO_MAP";
export function addSingle__Proper__ToMap(item) {
  return {
    type: ADD_SINGLE___actionCase___TO_MAP
    , item
  }
}

export const REQUEST_CREATE___actionCase__ = "REQUEST_CREATE___actionCase__";
function requestCreate__Proper__(__name__) {
  return {
    type: REQUEST_CREATE___actionCase__
    , __name__
  }
}

export const RECEIVE_CREATE___actionCase__ = "RECEIVE_CREATE___actionCase__";
function receiveCreate__Proper__(json) {
  return {
    type: RECEIVE_CREATE___actionCase__
    , id: json.__name__._id || null // to avoid silent error if empty json
    , item: json.__name__
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendCreate__Proper__(data) {
  return dispatch => {
    dispatch(requestCreate__Proper__(data))
    return callAPI('/api/__kebabName__s', 'POST', data)
      .then(json => dispatch(receiveCreate__Proper__(json)))
  }
}

export const REQUEST_UPDATE___actionCase__ = "REQUEST_UPDATE___actionCase__";
function requestUpdate__Proper__(__name__) {
  return {
    type: REQUEST_UPDATE___actionCase__
    , __name__
  }
}

export const RECEIVE_UPDATE___actionCase__ = "RECEIVE_UPDATE___actionCase__";
function receiveUpdate__Proper__(json) {
  return {
    type: RECEIVE_UPDATE___actionCase__
    , item: json.__name__
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendUpdate__Proper__(data) {
  return dispatch => {
    dispatch(requestUpdate__Proper__(data))
    return callAPI(`/api/__kebabName__s/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdate__Proper__(json)))
  }
}

export const REQUEST_DELETE___actionCase__ = "REQUEST_DELETE___actionCase__";
function requestDelete__Proper__(__name__Id) {
  return {
    type: REQUEST_DELETE___actionCase__
    , __name__Id
  }
}

export const RECEIVE_DELETE___actionCase__ = "RECEIVE_DELETE___actionCase__";
function receiveDelete__Proper__(json) {
  return {
    type: RECEIVE_DELETE___actionCase__
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDelete__Proper__(id))
    return callAPI(`/api/__kebabName__s/${id}`, 'DELETE')
      .then(json => dispatch(receiveDelete__Proper__(json)))
  }
}


/**
 * __actionCase__ LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest __name__Lists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  let list = Object.assign({}, state.__name__.lists, {});
  for(let i = 0; i < listArgs.length; i++) {
    list = list[listArgs[i]];
    if(!list) {
      return false;
    }
  }
  return list;
}

const shouldFetchList = (state, listArgs) => {
  /**
   * Helper method to determine whether to fetch the list or not from arbitrary
   * listArgs
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetchList with these args ", listArgs, "?");
  const list = findListFromArgs(state, listArgs);
  // console.log("LIST in question: ", list);
  if(!list || !list.items) {
    // yes, the list we're looking for wasn't found
    // console.log("X shouldFetch - true: list not found");
    return true;
  } else if(list.items.length < 1) {
    // yes, the list we're looking for is empty
    // console.log("X shouldFetch - true: length 0");
    return true
  } else if(list.isFetching) {
    // no, this list is already fetching
    // console.log("X shouldFetch - false: fetching");
    return false
  } else if(new Date().getTime() - list.lastUpdated > (1000 * 60 * 5)) {
    // yes, it's been longer than 5 minutes since the last fetch
    // console.log("X shouldFetch - true: older than 5 minutes");
    return true;
  } else {
    // maybe, depends on if the list was invalidated
    // console.log("X shouldFetch - " + list.didInvalidate + ": didInvalidate");
    return list.didInvalidate;
  }
}

export const fetchListIfNeeded = (...listArgs) => (dispatch, getState) => {
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if (shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchList(...listArgs));
  } else {
    return dispatch(return__Proper__ListPromise(...listArgs));
  }
}

export const return__Proper__ListPromise = (...listArgs) => (dispatch, getState) => {
  /**
   * This returns the list object from the reducer so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. This is because if we have any `.then()'s`
   * in the components, they will fail when we don't need to fetch.
   */
  return new Promise((resolve, reject) => {
    resolve({
      type: "RETURN___actionCase___LIST_WITHOUT_FETCHING"
      , listArgs: listArgs
      , list: findListFromArgs(getState(), listArgs).items
      , success: true
    })
  });
}

export const REQUEST___actionCase___LIST = "REQUEST___actionCase___LIST"
function request__Proper__List(listArgs) {
  return {
    type: REQUEST___actionCase___LIST
    , listArgs
  }
}

export const RECEIVE___actionCase___LIST = "RECEIVE___actionCase___LIST"
function receive__Proper__List(json, listArgs) {
  return {
    type: RECEIVE___actionCase___LIST
    , listArgs
    , list: json.__name__s
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function fetchList(...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(request__Proper__List(listArgs))

    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/__kebabName__s/by-[ARG]"
     *
     * if 2 args, return return "/api/__kebabName__s/by-[ARG1]/[ARG2]".
     * ex: /api/__kebabName__s/by-category/:category
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks
     */
    let apiTarget = "/api/__kebabName__s";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2) {
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
    } else if(listArgs.length > 2) {
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
      for(let i = 2; i < listArgs.length; i++) {
        apiTarget += `/${listArgs[i]}`;
      }
    }
    return callAPI(apiTarget).then(
      json => dispatch(receive__Proper__List(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET___actionCase___FILTER = "SET___actionCase___FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET___actionCase___FILTER
    , filter
    , listArgs
  }
}

export const SET___actionCase___PAGINATION = "SET___actionCase___PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET___actionCase___PAGINATION
    , pagination
    , listArgs
  }
}

export const INVALIDATE___actionCase___LIST = "INVALIDATE___actionCase___LIST"
export function invaldiateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: INVALIDATE___actionCase___LIST
    , listArgs
  }
}