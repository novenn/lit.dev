---
title: 响应式组件
eleventyNavigation:
  key: 响应式组件
  parent: 组件
  order: 3
versionLinks:
  v1: components/properties/
---

Lit组件接收输入，然后将其保存为JavaScript类的字段或属性。 *响应式属性*是一种特殊的属性(properties)，当它们被更改时会触发响应式更新周期、重新渲染组件以及读取或写入属性(attributes)。

{% switchable-sample %}

```ts
class MyElement extends LitElement {
  @property()
  name: string;
}
```

```js
class MyElement extends LitElement {
  static properties = {
    name: {},
  };
}
```

{% endswitchable-sample %}

Lit会自动管理你的响应式属性(properties)及其相应的属性(attributes)：

* **响应更新**。 Lit为每个响应式属性生成一个getter/setter对。当响应式属性发生变化时，组件就会安排更新。
* **属性(Attribute)处理**。 默认情况下，Lit会设置一个与属性(property)相对应的被观察属性(attribute)，当被观察属性(attribute)发生变化时更新属性(property)。 属性(property)值也可以选择性地被“反射”回属性(attribute)。
* **父类属性**。 Lit自动继承父类声明的属性。如果你不想更改选项，那么你不需要重新声明属性。
* **元素升级**。 如果一个Lit组件的元素已经存在于DOM树中，然后再去定义组件，那么就会触发Lit的升级逻辑，确保在升级之前设置在元素上的任何属性(property)在元素在升级时触发正确的响应式副作用。

## 公共属性(property)和内部状态

公共属性是组件公共API的一部分。一般来说，公共属性尤其是公共响应式属性，应该被视为“输入”。

组件不应更改自己的公共属性，而是响应用户的输入去更改。例如，一个菜单组件可能有一个公共属性`selected`，该属性可以由元素的创建的时候初始化为一个给定的值，但是当用户选择一个项目时，组件就可以响应用户的输入更改它。与此同时，组件应该触发一个事件来向组件的所有者表明`selected`属性已经被更改。查看[调度事件]({{baseurl}}/docs/components/events/#dispatching-events)了解更多信息。

Lit也支持“内部响应式状态”。内部响应式状态指的是那些不是组件API的响应式属性（property）。这些响应式属性（property）不存在与之对应的属性（attribute），通常情况下，这些属性在Typescript中被标记为protected或者private。

{% switchable-sample %}

```ts
@state()
private _counter = 0;
```

```js
static properties = {
  _counter: {state: true};
};

constructor()
  super();
  this._counter = 0;
}
```

{% endswitchable-sample %}

组件可以操作它自己的内部响应式状态。
在某些情况下，例如：如果用户可见的属性很难转换为内部状态，那么内部响应式状态可以直接从公共属性初始化。

与公共响应式属性一样，更新内部反应状态会触发更新周期。查看[内部响应式状态](#internal-reactive-state)了解相关详细信息，。

## 公共响应式属性{#declare}

可以使用装饰器或者静态`properties`字段定义组件的公共响应式属性。

不管使用哪种方式，你都可以传入一个对象来配置属性的一些特性。

### 使用装饰器定义属性 {#declare-with-decorators}

在一个类中使用`@property`装饰器来声明一个响应式属性。

```ts
class MyElement extends LitElement {
  @property({type: String})
  mode: string;

  @property({attribute: false})
  data = {};
}
```

`@property`装饰器的参数是一个[选项对象](#property-options)。如果省略选项对象参数的话，Lit会为所有选项指定默认值。

<div class="alert alert-info">

**使用装饰器** 装饰器是一个还处于在提案阶段的Javasript特性，因此，如果你需要一个像Babel或者Typescript那样的编译器才能使用它。查看[开启装饰器]({{baseurl}}/docs/components/decorators/#enabling-decorators)了解详情.

</div>

### 在静态属性类字段中声明属性

在静态属性类字段`properties`中声明属性:

```js
class MyElement extends LitElement {
  static properties = {
    mode: {type: String},
    data: {attribute: false},
  };

  constructor() {
    super();
    this.data = {};
  }
}
```

选项对象是空的话，相当于给所有选项设置了默认值。

### 在定义属性时需要避免一些类字段(Fileds)的问题{#avoiding-issues-with-class-fields}

[类字段](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/Public_class_fields)与响应式属性的交互存在问题。类字段被定义在元素实例上，而响应式属性被定义为元素原型上的访问器。根据JavaScript的规则，实例属性的访问顺序优先于原型属性，也就是说，实例属属性会隐藏原型属性。所以当我们使用类字段时，反应式属性访问器不起作用。设置属性后，元素不会更新。

在**JavaScript**中，你**不应该使用类字段**来定义响应式属性，相反，你必须在元素的构造函数中初始化属性。

```js
class MyElement extends LitElement {
  static properties = {
    mode: {type: String},
    data: {attribute: false},
  };

  // 译者注：使用类字段声明的字段将被定义到元素实例上
  private mode = "some thing";

  constructor() {
    super();
    // 译者注：在构造函数中直接初始化的属性，将被Lit封装为访问器（getter/setter）
    // 然后放到元素的原型上，从而使得属性具有响应式
    this.data = {};
  }
}
```

如果在使用**Typescript**的话，你**可以使用类字段**来声明响应式属性，但请记得把`tsconfig`中的`useDefineForClassFields`设置为`false`。虽然[有些情况下](https://www.typescriptlang.org/tsconfig#useDefineForClassFields)它默认就是`false`，但还是建议明确地把它设置为`false`。

如果使用**Babel**编译JavaScript的话，你也**可以使用类字段**来声明响应式属性。同样的，你需要把babel的配置文件`babelrc`中的`assumptions`的`setPublicClassFields`设置为`true`。注意：对于旧版本的Babel，你还需要引入插件`@babel/plugin-proposal-class-properties`。

```js
assumptions = {
  "setPublicClassFields": true
};

plugins = [
  ["@babel/plugin-proposal-class-properties"],
];
```

查看[避免类字段和装饰器的问题]({{baseurl}}/docs/components/decorators/#avoiding-issues-with-class-fields)来了解更多关于如何使用装饰器装饰类属性的信息。

### 属性选项

属性对象可以包含下列属性：

<dl>
<dt>

`attribute`

</dt>
<dd>

设置property是否与attribute关联，或者指定与property相关联的attribute的名称。默认值是true。如果`attribute`为false的话，则忽略`converter`、`reflect`和`type`选项。查看[设置属性名称](#observed-attributes)了解有关详细信息。

</dd>
<dt>

`converter`

</dt>
<dd>

设置用来在property和attribute之间做转换的[自定义转换器](#conversion-converter)。如果不设置的话，则使用[默认属性转换器](#conversion-type)。

</dd>
<dt>

`hasChanged`

</dt>
<dd>

设置一个函数用来检测property是否发生改变，如果该函数返回true，将触发一个更新。无论何时，只要property被设置了新的值，该函数就会被自动调用。如果未指定，LitElement将使用严格的不等式检查 (`newValue !== oldValue`) 来确定property值是否发生改变。查看[自定义更改检测](#haschanged)了解有关详细信息。

</dd>
<dt>

`noAccessor`

</dt>
<dd>

设置是否禁止生成默认属性访问器。这个选项很少需要。默认值为false，也就是默认生产属性访问器。查看[防止Lit生成属性访问器](#accessors-noaccessor)了解有关详细信息。

</dd>
<dt>

`reflect`

</dt>
<dd>

设置property属性值是否反射回关联的atrribute。默认值：false。有关详细信息，查看[启用属性反射](#reflected-attributes)了解有关详细信息。

</dd>
<dt>

`state`

</dt>
<dd>

设置该property为内部响应式状态。内部响应式状态也会像公共响应式属性那样触发更新，但Lit不会为其生成attribute，因此用户不能从组件外部访问它。当该选项设置为true的时候，等效于使用`@state`装饰器。查看[内部反应状态](#internal-reactive-state)了解有关详细信息。

</dd>
<dt>

`type`

</dt>
<dd>

当将值为字符串的attribute转换为property时，Lit的默认属性转换器会将字符串解析为type指定的类型，反之，将property反射为属性时也是如此。如果设置了`converter`，则该选项将被传递给转换器。如果`type`未指定，默认转换器将其视为`type: String`。查看[使用默认转换器](#conversion-type)了解更多信息。

使用TypeScript时，该选项通常应和为属性（property）声明的TypeScript类型一致。然而，`type`选项被Lit的“运行时”用于实现字符串序列化/反序列化，不应和Typescript的”类型检测“机制混淆。

</dd>

Omitting the options object or specifying an empty options object is equivalent to specifying the default value for all options.
省略选项对象或者传入一个空的选项对象相当于给所有的选项指定默认值。

## 内部响应式属性

*内部响应式状态*指的是不属于组件公共API的响应式属性。这些状态property没有与之对应的attibute，并且不允许从组件外部使用，只能由组件本身设置。

可以使用`@state`装饰器声明一个内部响应式状态：

```ts
@state()
protected _active = false;
```

也可以使用静态`properties`类字段声明内部响应式状态，做法是将属性的`state`选项设置为true。

```js
static properties = {
  _active: {state: true}
};

constructor() {
  this._active = false;
}
```

不应从组件外部引用内部响应式状态。在TypeScript中，这些属性应标记为私有或受保护。在Javascript中，我们建议约定使用下划线(`_`)作为私有或者受保护属性的前缀。

Internal reactive state works just like public reactive properties, except that there is no attribute associated with the property. **The only option you can specify for internal reactive state is the `hasChanged` function.**

The `@state` decorator can also serve as a hint to a code minifier that the property name can be changed during minification.

## What happens when properties change {#when-properties-change}

A property change can trigger a reactive update cycle, which causes the component to re-render its template.

When a property changes, the following sequence occurs:

1.  The property's setter is called.
1.  The setter calls the component's `requestUpdate` method.
1.  The property's old and new values are compared. If the property has a `hasChanged` function, it's called with the property's old and new values.
1.  If the property change is detected, an update is scheduled asynchronously. If an update is already scheduled, only a single update is executed.
1.  The component's `update` method is called, reflecting changed properties to attributes and re-rendering the component's templates.

There are many ways to hook into and modify the reactive update cycle. For more information, see [Reactive update cycle](/docs/components/lifecycle/#reactive-update-cycle).

For more information about property change detection, see [Customizing change detection](#haschanged).

## Attributes {#attributes}

While properties are great for receiving JavaScript data as input, attributes are the standard way HTML allows configuring elements from _markup_, without needing to use JavaScript to set properties. Providing both a property _and_ attribute interface for their reactive properties is a key way Lit components can be useful in a wide variety of environments, including those rendered without a client-side templating engine, such as static HTML pages served from CMSs.

By default, Lit sets up an observed attribute corresponding to each public reactive property, and updates the property when the attribute changes. Property values can also, optionally, be _reflected_ (written back to the attribute).

While element properties can be of any type, attributes are always strings. This impacts the [observed attributes](#observed-attributes) and [reflected attributes](#reflected-attributes) of non-string properties:

  * To **observe** an attribute (set a property from an attribute), the attribute value must be converted from a string to match the property type.

  * To **reflect** an attribute (set an attribute from a property), the property value must be converted to a string.

### Setting the attribute name {#observed-attributes}

By default, Lit creates a corresponding observed attribute for all public reactive properties. The name of the observed attribute is the property name, lowercased:

{% switchable-sample %}

```ts
// observed attribute name is "myvalue"
@property({ type: Number })
myValue = 0;
```

```js
// observed attribute name is "myvalue"
static properties = {
  myValue: { type: Number },
};

constructor() {
  super();
  this.myValue = 0;
}
```

{% endswitchable-sample %}

To create an observed attribute with a different name, set `attribute` to a string:

{% switchable-sample %}

```ts
// Observed attribute will be called my-name
@property({ attribute: 'my-name' })
myName = 'Ogden';
```

```js
// Observed attribute will be called my-name
static properties = {
  myName: { attribute: 'my-name' },
};

constructor() {
  super();
  this.myName = 'Ogden'
}
```

{% endswitchable-sample %}

To prevent an observed attribute from being created for a property, set `attribute` to `false`. The property will not be initialized from attributes in markup, and attribute changes won't affect it.

{% switchable-sample %}

```ts
// No observed attribute for this property
@property({ attribute: false })
myData = {};
```

```js
// No observed attribute for this property
static properties = {
  myData: { attribute: false },
};

constructor() {
  super();
  this.myData = {};
}
```

{% endswitchable-sample %}

Internal reactive state never has an associated attribute.

An observed attribute can be used to provide an initial value for a property from markup. For example:

```html
<my-element myvalue="99"></my-element>
```

### Using the default converter {#conversion-type}

Lit has a default converter that handles `String`, `Number`, `Boolean`, `Array`, and `Object` property types.

To use the default converter, specify the `type` option in your property declaration:

{% switchable-sample %}

```ts
// Use the default converter
@property({ type: Number })
count = 0;
```

```js
// Use the default converter
static properties = {
  count: { type: Number },
};

constructor() {
  super();
  this.count = 0;
}
```

{% endswitchable-sample %}

If you don't specify a type _or_ a custom converter for a property, it behaves as if you'd specified `type: String`.

The tables below shows how the default converter handles conversion for each type.

**From attribute to property**

| Type    | Conversion |
|:--------|:-----------|
| `String`  | If the element has the corresponding attribute, set the property to the attribute value. |
| `Number`  | If the element has the corresponding attribute, set the property to `Number(attributeValue)`. |
| `Boolean` | If the element has the corresponding attribute, set the property to true.<br>If not, set the property to false. |
| `Object`, `Array` | If the element has the corresponding attribute, set the property value to `JSON.parse(attributeValue)`. |

For any case except `Boolean`, if the element doesn't have the corresponding attribute, the property keeps its default value, or `undefined` if no default is set.

**From property to attribute**

| Type    | Conversion |
|:--------|:-----------|
| `String`, `Number` | If property is defined and non-null, set the attribute to the property value.<br>If property is null or undefined, remove the attribute. |
| `Boolean` | If property is truthy, create the attribute and set its value to an empty string. <br>If property is falsy, remove the attribute |
| `Object`, `Array` | If property is defined and non-null, set the attribute to `JSON.stringify(propertyValue)`.<br>If property is null or undefined, remove the attribute. |


### Providing a custom converter {#conversion-converter}

You can specify a custom property converter in your property declaration with the `converter` option:

```js
myProp: {
  converter: // Custom property converter
}
```

`converter` can be an object or a function. If it is an object, it can have keys for `fromAttribute` and `toAttribute`:

```js
prop1: {
  converter: {
    fromAttribute: (value, type) => {
      // `value` is a string
      // Convert it to a value of type `type` and return it
    },
    toAttribute: (value, type) => {
      // `value` is of type `type`
      // Convert it to a string and return it
    }
  }
}
```

If `converter` is a function, it is used in place of `fromAttribute`:

```js
myProp: {
  converter: (value, type) => {
    // `value` is a string
    // Convert it to a value of type `type` and return it
  }
}
```

If no `toAttribute` function is supplied for a reflected attribute, the attribute is set to the property value using the default converter.

If `toAttribute` returns `null` or `undefined`, the attribute is removed.

### Enabling attribute reflection {#reflected-attributes}

You can configure a property so that whenever it changes, its value is reflected to its [corresponding attribute](#observed-attributes). Reflected attributes are useful because attributes are visible to CSS, and to DOM APIs like `querySelector`.

For example:

```js
// Value of property "active" will reflect to attribute "active"
active: {reflect: true}
```

When the property changes, Lit sets the corresponding attribute value as described in [Using the default converter](#conversion-type) or [Providing a custom converter](#conversion-converter).

{% playground-example "properties/attributereflect" "my-element.ts" %}

Attributes should generally be considered input to the element from its owner, rather than under control of the element itself, so reflecting properties to attributes should be done sparingly. It's necessary today for cases like styling and accessibility, but this is likely to change as the platform adds features like the [`:state` pseudo selector](https://wicg.github.io/custom-state-pseudo-class/) and the [Accessibility Object Model](https://wicg.github.io/aom/spec/), which fill these gaps.

Reflecting properties of type object or array is not recommended. This can cause large objects to serialize to the DOM which can result in poor performance.

<div class="alert alert-info">

**Lit tracks reflection state during updates.** You may have realized that if property changes are reflected to an attribute and attribute changes update the property, it has the potential to create an infinite loop. However, Lit tracks when properties and attributes are set specifically to prevent this from happening

</div>

## Custom property accessors {#accessors}

By default, LitElement generates a getter/setter pair for all reactive properties. The setter is invoked whenever you set the property:

{% switchable-sample %}

```ts
// Declare a property
@property()
greeting: string = 'Hello';
...
// Later, set the property
this.greeting = 'Hola'; // invokes greeting's generated property accessor
```

```js
// Declare a property
static properties = {
  greeting: {},
}
constructor() {
  this.super();
  this.greeting = 'Hello';
}
...
// Later, set the property
this.greeting = 'Hola'; // invokes greeting's generated property accessor
```

{% endswitchable-sample %}

Generated accessors automatically call `requestUpdate()`, initiating an update if one has not already begun.

### Creating custom property accessors {#accessors-custom}

To specify how getting and setting works for a property, you can define your own getter/setter pair. For example:

{% switchable-sample %}

```ts
private _prop = 0;

set prop(val: number) {
  let oldVal = this._prop;
  this._prop = Math.floor(val);
  this.requestUpdate('prop', oldVal);
}

@property()
get prop() { return this._prop; }
```

```js
static properties = {
  prop: {},
};

_prop = 0;

set prop(val) {
  let oldVal = this._prop;
  this._prop = Math.floor(val);
  this.requestUpdate('prop', oldVal);
}

get prop() { return this._prop; }
```

{% endswitchable-sample %}

To use custom property accessors with the `@property` or `@state` decorators, put the decorator on the getter, as shown above.

The setters that Lit generates automatically call `requestUpdate()`. If you write your own setter you must call `requestUpdate()` manually, supplying the property name and its old value.

In most cases, **you do not need to create custom property accessors.** To compute values from existing properties, we recommend using the [`willUpdate`](/docs/components/lifecycle/#willupdate) callback, which allows you to set values during the update cycle without triggering an additional update. To perform a custom action after the element updates, we recommend using the [`updated`](/docs/components/lifecycle/#updated) callback. A custom setter can be used in rare cases when it's important to synchronously validate any value the user sets.

If your class defines its own accessors for a property, Lit will not overwrite them with generated accessors. If your class does not define accessors for a property, Lit will generate them, even if a superclass has defined the property or accessors.

### Prevent Lit from generating a property accessor {#accessors-noaccessor}

In rare cases, a subclass may need to change or add property options for a property that exists on its superclass.

To prevent Lit from generating a property accessor that overwrites the superclass's defined accessor, set `noAccessor` to `true` in the property declaration:

```js
static properties = {
  myProp: { type: Number, noAccessor: true }
};
```

You don't need to set `noAccessor` when defining your own accessors.

## Customizing change detection {#haschanged}

All reactive properties have a function, `hasChanged()`, which is called when the property is set.

`hasChanged` compares the property's old and new values, and evaluates whether or not the property has changed. If `hasChanged()` returns true, Lit starts an element update if one is not already scheduled. For more information on updates, see [Reactive update cycle](/docs/components/lifecycle/#reactive-update-cycle) .

The default implementation of `hasChanged()` uses a strict inequality comparison: `hasChanged()` returns `true` if `newVal !== oldVal`.

To customize `hasChanged()` for a property, specify it as a property option:

{% switchable-sample %}

```ts
@property({
  hasChanged(newVal: string, oldVal: string) {
    return newVal?.toLowerCase() !== oldVal?.toLowerCase();
  }
})
myProp: string | undefined;
```

```js
static properties = {
  myProp: {
    hasChanged(newVal, oldVal) {
      return newVal?.toLowerCase() !== oldVal?.toLowerCase();
    }
  }
};
```

{% endswitchable-sample %}

In the following example, `hasChanged()` only returns true for odd values.

{% playground-example "properties/haschanged" "my-element.ts" %}