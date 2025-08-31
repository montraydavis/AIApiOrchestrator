import { ConnectionBuilder } from "./ConnectionBuilder";
import { SchemaProperty, TransformFunction } from "./SchemaProperty";


export class TransformedProperty<T> {
  constructor(
    private property: SchemaProperty<any>,
    private transformer: TransformFunction<any, T>
  ) { }

  mapTo<TTarget>(target: SchemaProperty<TTarget>, mapping?: string): ConnectionBuilder<T, TTarget> {
    return new ConnectionBuilder(
      {
        ...this.property,
        type: this.getTransformedType()
      } as SchemaProperty<T>,
      target,
      mapping
    ).withTransform(this.transformer as any);
  }

  private getTransformedType(): any {
    // Infer type from transformer if possible
    return this.property.type;
  }
}
