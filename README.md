# Tutor Open Edx Helper

This package developed to be a helper in a simple project development of OpenEdx. It designed to provide customized component that would be used in plugin slot Open Edx. In the meantime, it only provide some component that generated for my case.


## How to use it in Open Edx?

It used plugin slot, and to make it works properly ensure to install and import in specific MFE. Each MFE probably has different version of dependencies.

```
from tutormfe.hooks import PLUGIN_SLOTS
from tutor import hooks


hooks.Filters.ENV_PATCHES.add_item(
    (
        "mfe-dockerfile-post-npm-install-authoring",
        """
# npm package
RUN npm install wowot-button-package --save
""",
    )
)

hooks.Filters.ENV_PATCHES.add_item(
    (
        "mfe-env-config-runtime-definitions-authoring",
        """
const { GenerateCourseButton } = await import('wowot-button-package');
""",
    )
)



PLUGIN_SLOTS.add_items([
    (
        "authoring",
        "org.openedx.frontend.authoring.course_outline_header_actions.v1",
"""
{
  op: PLUGIN_OPERATIONS.Insert,
  widget: {
    id: 'extra-button',
    priority: 60,
    type: DIRECT_PLUGIN,
    RenderWidget: GenerateCourseButton
  }
}
"""
    )
])

```