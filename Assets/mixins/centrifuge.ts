import { Centrifuge, ExtendedPublicationContext, Subscription } from "centrifuge";
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class CentrifugeMixin extends Vue {
    centrifuge: Centrifuge | null = null;
    subscription: Subscription | null = null;

    async initCentrifuge (channel: string) {
        const { data: urlData } = await this.$axios.get<{ url: string }>("/api/centrifugo/publicUrl");
        if (!urlData.success) {
            alert(urlData.error);
            return;
        }

        const centrifugeUrl = new URL(`${urlData.url}/connection/websocket`, window.location.href);
        centrifugeUrl.protocol = centrifugeUrl.protocol.replace("http", "ws");
        this.centrifuge = new Centrifuge(centrifugeUrl.href, {});

        this.centrifuge.on("connecting", (ctx) => {
            console.log("connecting", ctx);
        });

        this.centrifuge.on("error", (err) => {
            console.error("error", err);
        });

        this.centrifuge.on("connected", (ctx) => {
            console.log("connected", ctx);
        });

        this.centrifuge.connect();

        this.subscription = this.centrifuge.newSubscription(channel);

        this.subscription.on("error", (err) => {
            alert("Error in console for channel subscription");
            console.error("error", err);
        });

        this.subscription.on("unsubscribed", (ctx) => {
            if (ctx.code === 102)
                alert("Couldn't find channel");
            else if (ctx.code === 103)
                alert("Unauthorized to subscribe to channel");
            else if (ctx.code !== 0) {
                alert("Error in console for channel subscription");
                console.error("unsubscribed", ctx);
            } else
                console.log("unsubscribed", ctx);
        });

        this.subscription.on("subscribed", (ctx) => {
            console.log("subscribed", ctx.channel);
        });

        this.subscription.on("publication", (ctx) => this.handleData(ctx));

        this.subscription.subscribe();
    }

    handleData (ctx: ExtendedPublicationContext) {
        console.log("publication", ctx.channel, ctx.data);
        // Implement the logic to handle incoming data in your layout/page/component
    }

    beforeDestroy () {
        if (this.centrifuge)
            this.centrifuge.disconnect();
    }
}
