const scopes = {
  current: null
};

function shallowCompareArrays (a, b) {
  a = Array.isArray(a) ? a : [];
  b = Array.isArray(b) ? b : [];
  return a.length === b.length && a.every((el, ix) => el === b[ix]);
}

export default function t (tag, attributes, ...children) {
  const scope = {};
  return {
    __isTact: true,
    tag,
    attributes,
    children,
    scope
  };
}

export function useState (initialState) {
  const scope = scopes.current;
  scope.hookId = scope.hookId + 1;
  const hookId = scope.hookId;

  scope.states[hookId] = scope.states[hookId] || initialState;

  const setState = functionOrValue => {
    scope.states[hookId] = functionOrValue instanceof Function ? functionOrValue(scope.states[hookId]) : functionOrValue;
    scope.redraw();
  };
  return [scope.states[hookId], setState];
}

export function useEffect (runner, dependencies) {
  const scope = scopes.current;
  scope.hookId = scope.hookId + 1;

  const previousEffect = scope.effects[scope.hookId];

  scope.effects[scope.hookId] = {
    ...previousEffect,
    active: true,
    previousDependencies: previousEffect && previousEffect.dependencies,
    dependencies,
    runner
  };
}

function createComponent (parent, component, attributes, ...children) {
  const scope = {
    states: {},
    effects: {}
  };
  scopes.current = scope;

  scope.redraw = () => {
    scope.hookId = 0;
    scopes.current = scope;
    const built = component();

    if (scope.element) {
      scope.element.parentNode.removeChild(scope.element);
    }

    scope.element = recurse(parent, built);
    parent.appendChild(scope.element);

    Object.keys(scope.effects)
      .forEach(hookId => {
        const effect = scope.effects[hookId];

        const changed = !effect.dependencies || !shallowCompareArrays(effect.previousDependencies, effect.dependencies);
        if (changed) {
          effect.cleaner && effect.cleaner();
          effect.cleaner = effect.runner();
        }
      });
  };
  scope.redraw();

  scopes.current = null;
}

function createElement (parent, tagName, attributes, ...children) {
  const element = document.createElement(tagName);
  Object.assign(element, attributes);

  children.forEach(child => {
    recurse(element, child);
  });

  parent.appendChild(element);

  return element;
}

function recurse (parent, tree) {
  if (tree.tag instanceof Function) {
    return createComponent(parent, tree.tag, tree.attributes, ...tree.children);
  }

  if (tree.tag) {
    return createElement(parent, tree.tag, tree.attributes, ...tree.children);
  }

  const element = document.createTextNode(tree);
  parent.appendChild(element);

  return element;
}

export function render (tree, mountElement) {
  return recurse(mountElement, tree);
}
