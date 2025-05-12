import { supabase } from '@/lib/supabase';

/**
 * Comprehensive test function to diagnose Supabase connection and permission issues
 * This can be imported and used in component code for debugging purposes
 */
export const testSupabaseConnection = async () => {
  const results: Record<string, any> = {
    success: false,
    tests: {},
    errors: {},
  };

  try {
    console.log("🧪 Running Supabase connection tests...");

    // Test 1: Basic connection - check if we can connect at all
    try {
      console.log("Testing basic connection...");
      const { data, error } = await supabase.from('locations').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error("❌ Basic connection test failed:", error);
        results.tests.basicConnection = false;
        results.errors.basicConnection = error;
      } else {
        console.log("✅ Basic connection test passed");
        results.tests.basicConnection = true;
      }
    } catch (err) {
      console.error("❌ Error in basic connection test:", err);
      results.tests.basicConnection = false;
      results.errors.basicConnection = err;
    }

    // Test 2: Profiles table access
    try {
      console.log("Testing profiles table access...");
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error("❌ Profiles table access test failed:", error);
        results.tests.profilesAccess = false;
        results.errors.profilesAccess = error;
      } else {
        console.log("✅ Profiles table access test passed");
        results.tests.profilesAccess = true;
      }
    } catch (err) {
      console.error("❌ Error in profiles table access test:", err);
      results.tests.profilesAccess = false;
      results.errors.profilesAccess = err;
    }

    // Test 3: Inspector locations table access
    try {
      console.log("Testing inspector_locations table access...");
      const { data, error } = await supabase.from('inspector_locations').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error("❌ Inspector_locations table access test failed:", error);
        results.tests.inspectorLocationsAccess = false;
        results.errors.inspectorLocationsAccess = error;
      } else {
        console.log("✅ Inspector_locations table access test passed");
        results.tests.inspectorLocationsAccess = true;
      }
    } catch (err) {
      console.error("❌ Error in inspector_locations table access test:", err);
      results.tests.inspectorLocationsAccess = false;
      results.errors.inspectorLocationsAccess = err;
    }

    // Test 4: Auth functionality - test a dummy signup (this will fail, but we want to see how)
    try {
      console.log("Testing auth functionality with dummy signup...");
      const testEmail = `test-${Math.floor(Math.random() * 1000000)}@example.com`;
      const testPassword = "TestPassword123!";
      
      console.log(`Using test email: ${testEmail}`);
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            test_field: "This is just a test",
          },
        },
      });
      
      if (error) {
        console.log("📝 Auth test received expected error:", error.message);
        
        // Check if it's a permissions error or something else
        if (error.message.includes("permission") || error.status === 500) {
          console.error("❌ Auth test failed with permissions error");
          results.tests.authTest = false;
          results.errors.authTest = error;
        } else {
          console.log("✅ Auth test completed - received expected error but not a permissions issue");
          results.tests.authTest = "partial";
          results.errors.authTest = error;
        }
      } else {
        console.log("✅ Auth test passed - was able to create test user");
        results.tests.authTest = true;
        
        // If we created a user, sign them out
        if (data?.user?.id) {
          console.log("Cleaning up test user...");
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      console.error("❌ Error in auth test:", err);
      results.tests.authTest = false;
      results.errors.authTest = err;
    }

    // Test 5: Get JWT to check token structure
    try {
      console.log("Testing JWT access...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("❌ JWT access test failed:", error);
        results.tests.jwtAccess = false;
        results.errors.jwtAccess = error;
      } else {
        const session = data?.session;
        if (session) {
          console.log("✅ JWT access test passed - session exists");
          results.tests.jwtAccess = true;
          
          // Don't log the actual token for security reasons
          if (session.access_token) {
            console.log("Access token is present");
          }
        } else {
          console.log("📝 No active session found (this is normal if not logged in)");
          results.tests.jwtAccess = "partial";
        }
      }
    } catch (err) {
      console.error("❌ Error in JWT access test:", err);
      results.tests.jwtAccess = false;
      results.errors.jwtAccess = err;
    }

    // Overall test result
    const testResults = Object.values(results.tests);
    const allPassed = testResults.every(result => result === true);
    const anyFailed = testResults.some(result => result === false);
    
    if (allPassed) {
      console.log("🎉 All Supabase tests passed successfully");
      results.success = true;
    } else if (anyFailed) {
      console.log("❌ Some Supabase tests failed - see detailed results");
      results.success = false;
    } else {
      console.log("⚠️ Some Supabase tests passed with warnings");
      results.success = "partial";
    }

    return results;
  } catch (error) {
    console.error("❌ Fatal error running Supabase tests:", error);
    results.success = false;
    results.fatalError = error;
    return results;
  }
};

/**
 * Simple self-contained test function for the signup page
 * This doesn't return data but logs everything to the console
 */
export const quickTestSupabaseSignup = async () => {
  try {
    console.log("🧪 Quick signup test with Supabase...");
    
    // Test email with timestamp to ensure uniqueness
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "TestPassword123!";
    
    console.log(`Attempting signup with test email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: "Test User",
          role: "inspector",
        },
      },
    });
    
    if (error) {
      console.error("❌ Signup test failed:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return false;
    } else {
      console.log("✅ Signup test successful:", data?.user?.id);
      
      // Clean up by signing out
      await supabase.auth.signOut();
      return true;
    }
  } catch (error) {
    console.error("❌ Fatal error in signup test:", error);
    return false;
  }
}; 