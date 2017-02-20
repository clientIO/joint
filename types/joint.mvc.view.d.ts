declare namespace joint {
  namespace mvc {
    class View<T extends Backbone.Model> extends Backbone.View<T> {
      protected options: any;

      constructor(options: Backbone.ViewOptions<T>);

      initialize(options: Backbone.ViewOptions<T>);
      init(): void;
      onRender(): void;
      setTheme(theme: string, opt: any): void;
      addThemeClassName(theme: string): void;
      removeThemeClassName(theme: string): void;
      onSetTheme(oldTheme: string, newTheme: string): void;
      remove(): View<T>;
      onRemove(): void;
    }
  }
}
