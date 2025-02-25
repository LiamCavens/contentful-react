import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Button,
  Flex,
  IconButton,
  Menu,
  ModalConfirm,
  Text,
} from "@contentful/f36-components";
import {
  MoreHorizontalIcon as MenuIcon,
  SettingsIcon,
} from "@contentful/f36-icons";
import { css } from "emotion";
import { useState } from "react";
import { removeReference } from "../../ts/utilities/contentful/removeReference";

interface ManageButtonProps {
  entryId: string;
  sdk: FieldAppSDK;
  parentId: string;
  masterParentId: string;
  field: string;
}

const EntryManageButtons = ({
  sdk,
  entryId,
  parentId,
  masterParentId,
  field,
}: ManageButtonProps) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  return (
    <Flex
      className={css({
        gap: "0.5rem",
        alignItems: "center",
      })}
    >
      <Button
        startIcon={<SettingsIcon variant="muted" />}
        size="small"
        variant="transparent"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          sdk.navigator.openEntry(entryId, { slideIn: true });
        }}
      >
        Edit
      </Button>
      <ModalConfirm
        intent="positive"
        isShown={showRemoveConfirm}
        onCancel={() => {
          setShowRemoveConfirm(false);
        }}
        onConfirm={async () => {
          setShowRemoveConfirm(false);
          await removeReference(sdk, parentId, field, entryId, masterParentId);
        }}
      >
        <Text>Do you really want to remove this reference?</Text>
      </ModalConfirm>
      <Menu>
        <Menu.Trigger>
          <IconButton
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
            variant="secondary"
            icon={<MenuIcon />}
            aria-label="toggle menu"
          />
        </Menu.Trigger>
        <Menu.List>
          <Menu.Item
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              sdk.navigator.openEntry(entryId, {
                slideIn: true,
              });
            }}
          >
            Edit
          </Menu.Item>
          <Menu.Item
            onClick={async (e: React.MouseEvent) => {
              e.stopPropagation();
              showRemoveConfirm
                ? setShowRemoveConfirm(false)
                : setShowRemoveConfirm(true);
            }}
          >
            Remove
          </Menu.Item>
        </Menu.List>
      </Menu>
    </Flex>
  );
};

export default EntryManageButtons;
