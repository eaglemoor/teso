var app = new Vue({
    el: '#app',
    data() {
        return {
        text: '',
        items: []
        }
    },
    mounted() {
        let self = this;
        axios.get("//avalonbot.teso.world/crown/item/")
          .then(response => {
            self.items = response.data
            console.log(self.items);
          })
          .catch(error => {
            console.log(error);
          });
    }
})