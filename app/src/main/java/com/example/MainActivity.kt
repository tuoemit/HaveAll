package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.*
import com.example.ui.MainScreen
import com.example.ui.MainViewModel
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Inject/Fetch actual keys securely from BuildConfig
        val supabaseUrl = BuildConfig.SUPABASE_URL
        val supabaseKey = BuildConfig.SUPABASE_KEY

        viewModel.initializeCredentials(supabaseUrl, supabaseKey)

        setContent {
            var darkMode by remember { mutableStateOf(true) } // Black out theme default enabled!

            MyApplicationTheme(darkTheme = darkMode) {
                MainScreen(
                    viewModel = viewModel,
                    darkMode = darkMode,
                    onDarkThemeToggle = { darkMode = it }
                )
            }
        }
    }
}
