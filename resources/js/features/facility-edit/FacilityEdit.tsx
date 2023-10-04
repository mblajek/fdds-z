import {FormConfigWithoutTransformFn} from "@felte/core";
import {FelteForm, FelteSubmit} from "components/felte-form";
import {TextField, getTrimInputHandler} from "components/ui";
import {VoidComponent, createComputed, splitProps} from "solid-js";
import {z} from "zod";

export namespace FacilityEdit {
  export const getSchema = () =>
    z.object({
      name: z.string(),
      url: z.string(),
    });

  export type Input = z.input<ReturnType<typeof getSchema>>;
  export type Output = z.output<ReturnType<typeof getSchema>>;

  type FormProps = FormConfigWithoutTransformFn<Input>;
  type MyProps = {
    onCancel?: () => void;
    id: string;
  };
  type Props = FormProps & MyProps;

  export const EditForm: VoidComponent<Props> = (props) => {
    const [localProps, formProps]: [MyProps, FormProps] = splitProps(props, ["id", "onCancel"]);
    return (
      <FelteForm id={localProps.id} schema={getSchema()} {...formProps} class="flex flex-col gap-4">
        {(form) => {
          createComputed(() => {
            if (form.data("name") && !form.touched("url")) {
              // Suggest an url, e.g. "My Facility Name" --> "my-facility-name"
              form.setFields("url", form.data("name").toLowerCase().replace(/ /g, "-"));
            }
          });
          return (
            <>
              <div class="flex flex-col gap-1">
                <TextField name="name" type="text" autocomplete="off" onBlur={getTrimInputHandler()} />
                <TextField name="url" type="text" autocomplete="off" onBlur={getTrimInputHandler()} />
              </div>
              <FelteSubmit cancel={localProps.onCancel} />
            </>
          );
        }}
      </FelteForm>
    );
  };
}
