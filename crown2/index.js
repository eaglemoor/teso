Vue.use(Vuex);

const backend = "https://avalonbot.teso.world/crown";
const emptyTotalCrown = {
  Title: "Total (👑)",
  Description: "",
  Price: 0
}
const emptyTotalGold = {
  Title: "Total (💰)",
  Description: "",
  Price: 0
}

const store = new Vuex.Store({
  state: {
    items: [],
    totalCrown: emptyTotalCrown,
    totalGold: emptyTotalGold,
    message: '',
    fromUserID: '',
    toUserID: '',
    modalShow: false,
  },
  mutations: {
    del({ items }, id) {
      const i = items.map(item => item.id).indexOf(id);
      items.splice(i, 1);
    },

    updateItems(state, items) {
      state.items.splice(0, state.items.length, ...items);
      curId = 0;
      state.items.forEach(element => element.id = curId++);
    },

    updateTotalCrown(state, totalCrown) {
      state.totalCrown = totalCrown;
    },

    updateTotalGold(state, totalGold) {
      state.totalGold = totalGold;
    },

    setMessage(state, message) {
      state.message = message;
    },

    show(state) {
      state.modalShow = true;
    },

    validate(state) {
      fromUserID = state.fromUserID.trim()
      toUserID = state.toUserID.trim()
      if (!fromUserID) {
        throw new Error("Не заполнено поле fromUserID");
      } else if (!toUserID) {
        throw new Error("Не заполнено поле toUserID");
      } else if (fromUserID === toUserID) {
        throw new Error("Поля UserID совпадают");
      }
    }
  },
  actions: {
    async update({ commit }, keys) {
      commit("validate");
      items = [];
      totalCrown = emptyTotalCrown;
      totalGold = emptyTotalGold;
      if (keys.length) {
        const newPost = {
          fromUserID: fromUserID,
          toUserID: toUserID,
          items: keys,
        };
        const resp = await axios.post(backend + '/basket', newPost);
        items = resp.data.items;
        totalCrown = resp.data.totalCrown;
        totalGold = resp.data.totalGold;
      }
      commit("updateItems", items);
      commit("updateTotalCrown", totalCrown);
      commit("updateTotalGold", totalGold);
    },

    async add({ dispatch, state }, key) {
      keys = [...state.items.map(item => item.key), key];
      try {
        await dispatch("update", keys);
      } catch (err) {
        store.commit("setMessage", err);
        store.commit("show");
      }
    },

    async del({ dispatch, state }, id) {
      keys = state.items.map(item => item.key);
      keys.splice(id, 1);
      try {
        await dispatch("update", keys);
      } catch (err) {
        store.commit("setMessage", err);
        store.commit("show");
      }
    },

    async checkout({ state, commit }) {
      // скопировать корзину
      items = [...state.items];
      // очистить корзину
      state.items.splice(0, state.items.length);
      keys = items.map(item => item.key);
      savedTotalCrown = Object.assign({}, state.totalCrown);
      savedTotalGold = Object.assign({}, state.totalGold);
      state.totalCrown = emptyTotalCrown;
      state.totalGold = emptyTotalGold;
      // отправить запрос
      const newPost = {
        fromUserID: state.fromUserID,
        toUserID: state.toUserID,
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
    }
  },
  watch: {
    async searchQuery(searchQuery) {
      if (!searchQuery) {
        this.items = this.fullItems;
      } else {
        this.items = this.fullItems.filter(item =>
          item.nameRU.toLowerCase().match(searchQuery.toLowerCase()) || item.nameEN.toLowerCase().match(searchQuery.toLowerCase())
        );
      }
    }
  },
  computed: {
    hasNotItems() {
      return Object.keys(this.fullItems).length === 0;
    },
    count() {
      return store.state.items.length;
    },
  },
  methods: {
    add(key) {
      store.dispatch('add', key);
    },
    del(item) {
      store.dispatch('del', item.id);
    },
    buy() {
      try {
        store.commit("validate");
        store.commit("setMessage", "Подождите, заказ в работе!");
        store.dispatch('checkout');
      } catch (err) {
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