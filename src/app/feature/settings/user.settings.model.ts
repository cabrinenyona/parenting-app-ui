export type UserSettingId = "CHAT_DELAY" | "USE_MODAL_FOR_CHAT_RESPONSES" | "USE_BUTTON_HOME_SCREEN" | "USE_OFFLINE_CHAT";

export interface UserSetting {
    id: UserSettingId,
    name: string,
    type: "boolean" | "string" | "number",
    value: string,
    options?: UserSettingOption[]
    nativeOnly?: boolean
}

export interface UserSettingOption {
    name: string,
    value: string
}

export const BASE_USER_SETTINGS: UserSetting[] = [
    {
        id: "CHAT_DELAY",
        name: "Chat Message Delay",
        type: "number",
        value: "1000",
        options: [
            {
                name: "Slow",
                value: "5000"
            },
            {
                name: "Medium",
                value: "3000"
            },
            {
                name: "Fast",
                value: "1000"
            }
        ]
    },
    {
        id: "USE_MODAL_FOR_CHAT_RESPONSES",
        name: "Use Modal For Chat Responses",
        type: "boolean",
        value: "false"
    },
    {
        id: "USE_BUTTON_HOME_SCREEN",
        name: "Use Button Home Screen",
        type: "boolean",
        value: "true"
    },
    {
        id: "USE_OFFLINE_CHAT",
        name: "Use Button Home Screen",
        type: "boolean",
        value: "true",
        nativeOnly: true
    }
]