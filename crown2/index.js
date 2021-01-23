// Vue.use(Vuex);

const backend = "https://avalonbot.teso.world/crown";

const validateUserId = userId => {
  return userId.trim().length > 0 ? true : false;
}

const store = new Vuex.Store({
  state: {
    items: [],
    crownPrice: 0,
    message: '',
    fromUserID: '',
    toUserID: '',
    modalShow: false,
  },
  getters: {
    totalCrown: ({items}) => items.length ? items.map(item => item.discont || item.price).reduce((a, b) => a + b) : 0,
    totalGold: ({crownPrice}, getters) => getters.totalCrown * crownPrice,
  },
  mutations: {
    del({ items }, id) {
      const i = items.map(item => item.id).indexOf(id);
      items.splice(i, 1);
    },

    update(state, items) {
      state.items.splice(0, state.items.length, ...items);      
      curId = 0;
      state.items.forEach(element => element.id = curId++);
    },

    setMessage(state, message) {
      state.message = message;
    },

    show(state) {
      state.modalShow = true;
    },

    setFromUserID(state, fromUserID) {
      state.fromUserID = fromUserID;
    },

    setCrownPrice(state, price) {
      state.crownPrice = price;
    },
  },
  actions: {
    async setPrice({ commit, state }) {
      crownPrice = 0;
      if (validateUserId(state.fromUserID)) {
        const resp = await axios.post(backend + '/price', { fromUserID: state.fromUserID });
        crownPrice = resp.data.crownPrice
      }
      commit("setCrownPrice", crownPrice);
    },

    async add({ commit, state }, item) {
      commit("update", [...state.items, item]);
    },

    del({ commit, state }, id) {
      items = [...state.items];
      items.splice(id, 1);      
      commit("update", items);
    },

    async checkout({state, commit}) {
      // скопировать корзину
      items = [...state.items];
      // очистить корзину
      state.items.splice(0, state.items.length);
      keys = items.map(item => item.key);
      savedTotalCrown = state.totalCrown;
      savedTotalGold = state.totalGold;
      savedCrownPrice = state.crownPrice;
      state.totalCrown = 0;
      state.totalGold = 0;
      state.crownPrice = 0;
      // отправить запрос
      const newPost = {
        fromUserID: state.fromUserID.trim(),
        toUserID: state.toUserID.trim(),
        items: keys,
      };
      
      try { // если успешный, очистить корзину, написать успех
        const resp = await axios.post(backend + '/buy', newPost);
        commit("setMessage", resp.data.message);
      } catch (err) { // если неуспешный, востановить корзину, написать ошибку
        state.items.splice(0, state.items.length, ...items);
        state.totalCrown = savedTotalCrown;
        state.totalGold = savedTotalGold;
        store.commit("setMessage", err);
        store.commit("show");
      }
    }
  }
})

var app = new Vue({
  el: '#app',
  data() {
    return {
      searchQuery: '',
      fullItems: [],
      items: [],
      fromUserID: '',
    }
  },
  watch: {
    searchQuery(searchQuery) {
      if (!searchQuery) {
        this.items = this.fullItems;
      } else {
        this.items = this.fullItems.filter(item => 
          item.nameRU.toLowerCase().match(searchQuery.toLowerCase()) || item.nameEN.toLowerCase().match(searchQuery.toLowerCase())
        );
      }
    },
    fromUserID(fromUserID) {      
      store.commit("setFromUserID", fromUserID);
      this.setPrice();
    }
  },
  created: function () {
    this.setPrice = _.debounce(() => store.dispatch("setPrice"), 1000)
  },
  computed: {
    hasNotItems() {
      return Object.keys(this.fullItems).length === 0
    },    
    validateOrder() {
      fromUserID = store.state.fromUserID;
      toUserID = store.state.toUserID;
      return this.count > 0 && validateUserId(fromUserID) && validateUserId(toUserID);
    },
    count: () => store.state.items.length,
    totalCrown: () => store.getters.totalCrown,
    totalGold: () => store.getters.totalGold,
    toUserIDstate: () => !validateUserId(store.state.toUserID),
    fromUserIDstate: () => !validateUserId(store.state.fromUserID),
  },
  methods: {
    add: item => store.dispatch('add', item),
    del: item => store.dispatch('del', item.id),
    buy() {
      try {
        store.commit("setMessage", "Подождите, заказ в работе!");
        store.dispatch('checkout');
      } catch(err) {
        store.commit("setMessage", err);
      }
      store.commit("show", true);      
    }
  },
  async mounted() {
    try {
      const response = await axios.get(backend + "/item");
      this.fullItems = this.items = response.data;
    } catch (err) {      
      store.commit("setMessage", err);
      store.commit("show", true);
    }
  }
})