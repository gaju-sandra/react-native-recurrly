const app = require('./app.json')

module.exports = {
    ...app.expo,
    extra: {
        ...app.expo.extra,
        posthogProjectToken: process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN,
        posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,

        eas: {
            projectId: "a87895c8-4195-40de-831a-3db686a3cf9e"
        },
    },


}
