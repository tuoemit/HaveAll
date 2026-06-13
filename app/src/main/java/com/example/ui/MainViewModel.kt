package com.example.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.MainActivity
import com.example.data.RetrofitClient
import com.example.data.SupabaseConfig
import com.example.data.SupabaseProxy
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface UiState<out T> {
    object Loading : UiState<Nothing>
    data class Success<out T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

class MainViewModel : ViewModel() {

    private val _supabaseUrl = MutableStateFlow<String>("")
    val supabaseUrl: StateFlow<String> = _supabaseUrl.asStateFlow()

    private val _supabaseKey = MutableStateFlow<String>("")
    val supabaseKey: StateFlow<String> = _supabaseKey.asStateFlow()

    private val _proxiesState = MutableStateFlow<UiState<List<SupabaseProxy>>>(UiState.Loading)
    val proxiesState: StateFlow<UiState<List<SupabaseProxy>>> = _proxiesState.asStateFlow()

    private val _configsState = MutableStateFlow<UiState<List<SupabaseConfig>>>(UiState.Loading)
    val configsState: StateFlow<UiState<List<SupabaseConfig>>> = _configsState.asStateFlow()

    // Pagination management
    private var proxiesOffset = 0
    private var configsOffset = 0
    private val limit = 20

    private val loadedProxies = mutableListOf<SupabaseProxy>()
    private val loadedConfigs = mutableListOf<SupabaseConfig>()

    var isConfigEndReached = false
        private set
    var isProxyEndReached = false
        private set

    fun initializeCredentials(url: String, key: String) {
        _supabaseUrl.value = url.trim()
        _supabaseKey.value = key.trim()
        if (url.isNotEmpty() && key.isNotEmpty()) {
            refreshData()
        } else {
            _proxiesState.value = UiState.Error("Supabase credentials missing! Click settings below to configure.")
            _configsState.value = UiState.Error("Supabase credentials missing! Click settings below to configure.")
        }
    }

    fun refreshData() {
        proxiesOffset = 0
        configsOffset = 0
        isConfigEndReached = false
        isProxyEndReached = false
        loadedProxies.clear()
        loadedConfigs.clear()
        
        loadNextProxiesPage()
        loadNextConfigsPage()
    }

    fun loadNextProxiesPage() {
        val url = _supabaseUrl.value
        val key = _supabaseKey.value
        if (url.isEmpty() || key.isEmpty() || isProxyEndReached) return

        viewModelScope.launch {
            if (proxiesOffset == 0) {
                _proxiesState.value = UiState.Loading
            }
            try {
                val api = RetrofitClient.createService(url)
                val response = api.getProxies(apiKey = key, authHeader = "Bearer $key", limit = limit, offset = proxiesOffset)
                if (response.isEmpty()) {
                    isProxyEndReached = true
                } else {
                    loadedProxies.addAll(response)
                    proxiesOffset += limit
                }
                _proxiesState.value = UiState.Success(loadedProxies.toList())
            } catch (e: Exception) {
                _proxiesState.value = UiState.Error("Failed to load proxies: ${e.localizedMessage ?: e.message}")
            }
        }
    }

    fun loadNextConfigsPage() {
        val url = _supabaseUrl.value
        val key = _supabaseKey.value
        if (url.isEmpty() || key.isEmpty() || isConfigEndReached) return

        viewModelScope.launch {
            if (configsOffset == 0) {
                _configsState.value = UiState.Loading
            }
            try {
                val api = RetrofitClient.createService(url)
                val response = api.getConfigs(apiKey = key, authHeader = "Bearer $key", limit = limit, offset = configsOffset)
                if (response.isEmpty()) {
                    isConfigEndReached = true
                } else {
                    loadedConfigs.addAll(response)
                    configsOffset += limit
                }
                _configsState.value = UiState.Success(loadedConfigs.toList())
            } catch (e: Exception) {
                _configsState.value = UiState.Error("Failed to load configs: ${e.localizedMessage ?: e.message}")
            }
        }
    }

    // Connect to MTProto Telegram proxy
    fun connectProxy(context: Context, tgLink: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(tgLink))
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback if telegram isn't installed
            Toast.makeText(context, "Telegram app not found or could not open!", Toast.LENGTH_LONG).show()
        }
    }

    // Connect config via hiddify app schema
    fun connectHiddifyConfig(context: Context, rawConfig: String) {
        try {
            // Support adding profiles directly into Hiddify or similar v2ray clients using the intent schema:
            // clashing/v2ray url schemes are often: hiddify://import/URL_OF_FILE or adding config directly via hiddify://import/#CONFIG_ENCODED
            val prefixScheme = "hiddify://import/#"
            val uri = Uri.parse("$prefixScheme$rawConfig")
            val intent = Intent(Intent.ACTION_VIEW, uri)
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Hiddify app not installed or schema import failed!", Toast.LENGTH_SHORT).show()
        }
    }
}
